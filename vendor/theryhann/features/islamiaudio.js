/**
 * 🎧 ISLAMI AUDIO v7.37.0 — audio murottal & tilawah per-ayat + KARTU SPOTIFY
 * ------------------------------------------------------------------
 *  • .audiomurottal <surah:ayat>  — bacaan MUROTTAL merdu
 *      Sumber: Syaikh Mishary Rashid Alafasy (everyayah.com, 128kbps)
 *  • .audiotilawah <surah:ayat>   — bacaan TILAWAH (tajwid tegas)
 *      Sumber: Mahmood Khaleel Al-Husaree (everyayah.com, 64kbps)
 *
 *  Contoh: .audiomurottal 2:74 · .audiotilawah 18:10 · alias pendek:
 *  .murottal .tilawah .audiomurattal
 *
 *  v7.37.0 — teks biasa diganti KARTU HTML tema Spotify "NOW PLAYING"
 *  (pembangun kartunya DITANAM di file ini, jadi plugin ini mandiri dan
 *  bisa dipasang lewat `.>_ islamiaudio --paksa`): sampul animasi, ♥,
 *  seekbar hijau, ⇄ ⏮ ⏯ ⏭ ↻,
 *  panel AYAT & TERJEMAHAN (Arab + latin + terjemahan ID + tafsir singkat),
 *  ketuk sampul → terjemahan menyala per kalimat mengikuti detik bacaan.
 *  Audio kartu: stream /a/<id> bila web bot aktif (lagu penuh), kalau tidak
 *  audio dikompres ffmpeg / versi 64kbps ditanam base64, dan bila masih
 *  kebesaran kartu jalan MODE VISUAL (audio tetap ada di pesan WA).
 */
import { config } from '../config.js'
import { surahDetail, ayahDetail } from '../lib/islami.js'
import { truncate } from '../lib/functions.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { getSettings } from '../lib/database.js'
import { kecilkan } from '../lib/lagupenuh.js'

/* ==================================================================
 *  PEMBANGUN KARTU HTML TEMA SPOTIFY (ditanam di plugin ini — v7.37.0)
 *  Semua helper di bawah mandiri: tidak ada file lib/ baru yang dibutuhkan.
 * ================================================================== */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/** 12 warna latar sampul (dipilih dari nomor surah) */
const PALET = [
  ['#123c2e', '#1f7a55'], ['#3a2a1a', '#a3702f'], ['#1b2a44', '#3d6db5'], ['#3a1f2b', '#a8456b'],
  ['#14323a', '#2e8a94'], ['#2f2340', '#7b5bc4'], ['#3a3416', '#b39b2a'], ['#12333a', '#2c8f8a'],
  ['#3d1f1f', '#b04b4b'], ['#1d3320', '#4f9c53'], ['#2b2b33', '#6f7d8c'], ['#3a2438', '#a05a94']
]

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
.mt{position:relative;max-width:520px;margin:0 auto;padding:14px 18px 22px;color:#fff;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow:hidden;background:linear-gradient(180deg,var(--c1,#123c2e) 0%,#141816 40%,#121212 100%)}
.mt .anim{animation:fadeUp .45s both}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%{transform:scale(.72);opacity:.55}70%{transform:scale(1.28);opacity:0}100%{opacity:0}}
@keyframes eq{0%,100%{height:18%}50%{height:100%}}
@keyframes glow{0%,100%{box-shadow:0 0 0 rgba(30,215,96,0)}50%{box-shadow:0 0 26px rgba(30,215,96,.45)}}
.top{display:flex;align-items:center;justify-content:space-between;height:38px}
.top .ic{flex:none;width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:#fff;opacity:.9}
.top .mid{flex:1;min-width:0;text-align:center}
.top .mid small{display:block;font-size:9.5px;letter-spacing:2.2px;color:#cfd8d3;text-transform:uppercase}
.top .mid b{display:block;font-size:13.5px;font-weight:700;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cvw{position:relative;margin:20px 0 20px;padding-bottom:100%;border-radius:12px;overflow:hidden;background:#101312;box-shadow:0 20px 44px rgba(0,0,0,.62);cursor:pointer}
.cv{position:absolute;inset:0;background:radial-gradient(125% 115% at 28% 18%,var(--c2,#1f7a55) 0%,#101714 62%,#0a0c0b 100%)}
.cv .art{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.cv .art svg{width:74%;height:74%;overflow:visible}
.cv .st{fill:none;stroke:rgba(255,255,255,.62);stroke-width:.9}
.cv .st2{fill:none;stroke:rgba(255,255,255,.3);stroke-width:.7}
.cv .rot{transform-origin:40px 40px;animation:spin 26s linear infinite;animation-play-state:paused}
.mt.playing .cv .rot{animation-play-state:running}
.cv .tick{stroke:rgba(255,255,255,.55);stroke-width:1.4;stroke-linecap:round}
.pg{position:absolute;left:50%;top:50%;width:46%;padding-bottom:46%;margin:-23% 0 0 -23%;border:1px solid rgba(255,255,255,.35);border-radius:50%;opacity:0;animation:pulse 3.2s ease-out infinite;animation-play-state:paused}
.mt.playing .pg{animation-play-state:running}
.pg.b{animation-delay:1.1s}.pg.c{animation-delay:2.2s}
.bdg{position:absolute;left:12px;top:12px;background:rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:5px 10px;font-size:10px;letter-spacing:1.4px;color:#e9f2ee}
.eqb{position:absolute;right:12px;bottom:12px;display:flex;align-items:flex-end;gap:3px;height:26px}
.eqb i{display:block;width:3px;height:18%;background:#1ed760;border-radius:2px;animation:eq .95s ease-in-out infinite;animation-play-state:paused}
.mt.playing .eqb i{animation-play-state:running}
.eqb i:nth-child(2){animation-delay:.18s}.eqb i:nth-child(3){animation-delay:.36s}
.eqb i:nth-child(4){animation-delay:.54s}.eqb i:nth-child(5){animation-delay:.72s}
.lyr{position:absolute;inset:0;background:rgba(14,17,16,.95);padding:16px 14px;overflow:auto;display:none;scroll-behavior:smooth}
.lyr.on{display:block}
.lyr small{display:block;font-size:9.5px;letter-spacing:2px;color:#1ed760;text-transform:uppercase;margin-bottom:12px}
.lyr .l{font-size:16px;line-height:1.5;font-weight:700;color:rgba(255,255,255,.42);padding:5px 0;transition:color .22s}
.lyr .l.on{color:#fff}
.lyr .l:active{color:#1ed760}
.lyr .kos{color:#b3b3b3;font-size:13px;font-weight:400;text-align:center;margin-top:36px}
.ttl{display:flex;align-items:center;justify-content:space-between;gap:12px}
.ttl .t{min-width:0}
.ttl .t b{display:block;font-size:21px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ttl .t span{display:block;font-size:14px;color:#b3b3b3;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hrt{flex:none;width:38px;height:38px;display:flex;align-items:center;justify-content:center;color:#fff;border-radius:50%}
.hrt.on{color:#1ed760;animation:glow 1.8s ease-in-out infinite}
.sk{margin-top:16px}
.sk input{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;outline:none;background:linear-gradient(90deg,#1ed760 var(--p,0%),rgba(255,255,255,.28) var(--p,0%))}
.sk input::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff}
.sk .tm{display:flex;justify-content:space-between;font-size:11.5px;color:#b3b3b3;margin-top:8px}
.ctl{display:flex;align-items:center;justify-content:space-between;margin-top:12px}
.ctl .b{flex:none;width:46px;height:46px;display:flex;align-items:center;justify-content:center;color:#fff}
.ctl .b.dim{color:#b3b3b3}
.ctl .b.on{color:#1ed760}
.ctl .big{flex:none;width:74px;height:74px;padding:0;border:0;border-radius:50%;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.45)}
.ctl .big:active{transform:scale(.95)}
.ay{margin-top:20px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px 14px 16px}
.ay .lb{font-size:9.5px;letter-spacing:2px;color:#1ed760;text-transform:uppercase}
.ay .ar{font-size:25px;line-height:2.05;text-align:right;direction:rtl;margin-top:10px;font-family:"Segoe UI",Tahoma,"Geeza Pro","Noto Naskh Arabic","Traditional Arabic",serif;color:#fff}
.ay .la{font-size:11.5px;line-height:1.6;color:#a9b6b0;font-style:italic;margin-top:10px}
.ay .tr{font-size:14px;line-height:1.7;color:#eaeaea;margin-top:10px}
.ay .taf{font-size:12px;line-height:1.6;color:#9fb0a8;margin-top:11px;border-left:2px solid #1ed760;padding-left:10px}
.row{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
.chip{flex:1 1 44%;border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:9px 10px;font-size:11.5px;text-align:center;color:#fff;background:rgba(255,255,255,.04)}
.chip:active{background:rgba(255,255,255,.14)}
.bot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:16px;color:#b3b3b3;font-size:10.5px;letter-spacing:1px}
.bot .pill{flex:none;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:5px 10px;text-transform:uppercase}
.bot #st{flex:1;min-width:0;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wm{text-align:center;font-size:9.5px;color:rgba(255,255,255,.36);margin-top:12px;letter-spacing:1.2px}
.tst{position:absolute;left:50%;bottom:52px;transform:translate(-50%,10px);background:#1ed760;color:#04140b;font-size:11.5px;font-weight:700;padding:8px 14px;border-radius:999px;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;max-width:86%;text-align:center}
.tst.on{opacity:1;transform:translate(-50%,0)}
`

const JS = `
(function(){
  var D = __MT;
  var au = document.getElementById('au'), root = document.getElementById('mt');
  var seek = document.getElementById('seek'), cur = document.getElementById('cur'), tot = document.getElementById('tot');
  var big = document.getElementById('big'), rep = document.getElementById('rep'), shf = document.getElementById('shf');
  var hrt = document.getElementById('hrt'), lyr = document.getElementById('lyr'), cv = document.getElementById('cvw');
  var st = document.getElementById('st'), tgl = document.getElementById('tgl'), tst = document.getElementById('tst');
  var IP = '<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var IZ = '<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  var loop = false, acak = false, drag = false, visual = false, vt = 0, vtimer = null;
  var dur = Number(D.durasi) || 0;
  function fmt (s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function setDur (d) { if (isFinite(d) && d > 0) dur = d; tot.textContent = fmt(dur); susunBaris(); }
  big.innerHTML = IP; tot.textContent = fmt(dur);
  function toast (t) { tst.textContent = t; tst.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { tst.classList.remove('on'); }, 2200); }
  /* ---------- audio ---------- */
  if (D.url) { au.src = D.url; au.load(); } else { mulaiVisual('AUDIO DI PESAN BAWAH'); }
  au.onloadedmetadata = function () { setDur(au.duration); st.textContent = 'SIAP'; };
  au.onerror = function () {
    if (D.cadangan && au.src !== D.cadangan) { st.textContent = 'CADANGAN'; au.src = D.cadangan; au.load(); au.play().catch(function () {}); return; }
    mulaiVisual('MODE VISUAL');
  };
  au.onplay = function () { big.innerHTML = IZ; root.classList.add('playing'); st.textContent = 'PLAYING'; stopVisual(); };
  au.onpause = function () { big.innerHTML = IP; root.classList.remove('playing'); if (!au.ended) st.textContent = 'PAUSED'; };
  au.onended = function () { if (loop) { au.currentTime = 0; au.play(); } else { big.innerHTML = IP; root.classList.remove('playing'); st.textContent = 'SELESAI'; } };
  function mulaiVisual (label) {
    visual = true; stopVisual(); st.textContent = label;
    vtimer = setInterval(function () {
      vt += 1; if (vt > dur) { vt = dur; clearInterval(vtimer); vtimer = null; }
      var p = dur ? vt / dur * 100 : 0;
      seek.value = p; seek.style.setProperty('--p', p + '%'); cur.textContent = fmt(vt); sorot(vt);
    }, 1000);
  }
  function stopVisual () { if (vtimer) { clearInterval(vtimer); vtimer = null; } }
  function posisi () { return visual ? vt : (au.currentTime || 0); }
  function total () { return (au.duration && isFinite(au.duration) && au.duration > 0) ? au.duration : dur; }
  function toggle () {
    if (!D.url && !au.src) { toast('Audio ada di pesan audio bot'); return; }
    if (au.paused) { var p = au.play(); if (p && p.catch) p.catch(function () { toast('Ketuk ▶ sekali lagi'); }); } else au.pause();
  }
  big.onclick = toggle;
  document.getElementById('prev').onclick = function () { if (!visual) au.currentTime = 0; vt = 0; cur.textContent = '0:00'; };
  document.getElementById('next').onclick = function () { var d = total(); if (!visual) au.currentTime = Math.max(0, d - 0.4); vt = Math.max(0, d - 0.4); };
  rep.onclick = function () { loop = !loop; rep.className = 'b' + (loop ? ' on' : ' dim'); toast(loop ? 'Ulangi ayat: AKTIF' : 'Ulangi ayat: mati'); };
  shf.onclick = function () { acak = !acak; shf.className = 'b' + (acak ? ' on' : ' dim'); var d = total(); var t = Math.random() * d * 0.85; if (!visual) au.currentTime = t; vt = t; toast(acak ? 'Loncat acak: AKTIF' : 'Loncat acak: mati'); };
  hrt.onclick = function () { hrt.classList.toggle('on'); var on = hrt.classList.contains('on'); try { localStorage.setItem('mt_like_' + D.kunci, on ? '1' : ''); } catch (e) {} toast(on ? 'Disimpan ke ayat favorit' : 'Dihapus dari favorit'); };
  try { if (localStorage.getItem('mt_like_' + D.kunci)) hrt.classList.add('on'); } catch (e) {}
  au.ontimeupdate = function () { if (drag) return; var d = total(); var p = d ? au.currentTime / d * 100 : 0; seek.value = p; seek.style.setProperty('--p', p + '%'); cur.textContent = fmt(au.currentTime); sorot(au.currentTime); };
  seek.oninput = function () { drag = true; seek.style.setProperty('--p', seek.value + '%'); cur.textContent = fmt(total() * seek.value / 100); };
  seek.onchange = function () { drag = false; var t = total() * seek.value / 100; if (!visual) au.currentTime = t; vt = t; };
  /* ---------- baris terjemahan (ala lirik) ---------- */
  var baris = [], aktif = -1;
  function susunBaris () {
    var T = D.baris || []; if (!T.length) return;
    var d = total() || 60;
    for (var i = 0; i < T.length; i++) { if (!baris[i]) { var el = document.createElement('div'); el.className = 'l'; lyr.appendChild(el); baris[i] = el; } baris[i].textContent = T[i]; baris[i].setAttribute('data-t', (i / T.length * d).toFixed(2)); }
    for (var j = 0; j < baris.length; j++) { baris[j].onclick = buatLoncat(j); }
    aktif = -1; sorot(posisi());
  }
  function buatLoncat (i) { return function (e) { e.stopPropagation(); var t = parseFloat(baris[i].getAttribute('data-t')) || 0; if (!visual) { au.currentTime = t; if (au.paused) toggle(); } else vt = t; sorot(t); }; }
  function sorot (t) {
    if (!baris.length) return; var i = -1;
    for (var j = 0; j < baris.length; j++) { if (parseFloat(baris[j].getAttribute('data-t')) <= t + 0.25) i = j; }
    if (i === aktif) return;
    if (aktif >= 0 && baris[aktif]) baris[aktif].classList.remove('on');
    aktif = i;
    if (i >= 0) { baris[i].classList.add('on'); if (lyr.classList.contains('on')) lyr.scrollTop = Math.max(0, baris[i].offsetTop - lyr.clientHeight / 2 + 24); }
  }
  if ((D.baris || []).length) susunBaris();
  else { var k = document.createElement('div'); k.className = 'kos'; k.textContent = 'Terjemahan tidak tersedia'; lyr.appendChild(k); }
  function toggleLirik () { lyr.classList.toggle('on'); var on = lyr.classList.contains('on'); tgl.textContent = on ? 'COVER' : 'AYAT'; if (on && aktif >= 0 && baris[aktif]) lyr.scrollTop = Math.max(0, baris[aktif].offsetTop - lyr.clientHeight / 2 + 24); }
  cv.onclick = toggleLirik; tgl.onclick = toggleLirik;
  var y0 = null;
  cv.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true });
  cv.addEventListener('touchend', function (e) { if (y0 !== null && y0 - e.changedTouches[0].clientY > 40 && !lyr.classList.contains('on')) toggleLirik(); y0 = null; }, { passive: true });
  /* ---------- salin perintah (webview tak bisa kirim pesan) ---------- */
  function salin (teks, pesan) {
    function jatuh () {
      try {
        var ta = document.createElement('textarea'); ta.value = teks;
        ta.style.position = 'absolute'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta); toast(pesan);
      } catch (e) { toast('Salin manual: ' + teks); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(teks).then(function () { toast(pesan); }, jatuh); } else jatuh();
  }
  var c1 = document.getElementById('cp1'), c2 = document.getElementById('cp2');
  if (c1) c1.onclick = function () { salin(D.perintah, 'Tersalin: ' + D.perintah); };
  if (c2) c2.onclick = function () { salin(D.perintah2, 'Tersalin: ' + D.perintah2); };
  st.textContent = D.url ? 'MEMUAT' : (D.cadangan ? 'MEMUAT' : 'AUDIO DI PESAN BAWAH');
})();
`

/** SVG sampul: bintang 8 + cincin + piringan putar (tanpa gambar luar) */
function sampulSvg () {
  let ticks = ''
  for (let i = 0; i < 24; i++) {
    const a = (i * 15) * Math.PI / 180
    const r1 = 34, r2 = i % 6 === 0 ? 30 : 32
    ticks += `<line class="tick" x1="${(40 + Math.cos(a) * r1).toFixed(2)}" y1="${(40 + Math.sin(a) * r1).toFixed(2)}" x2="${(40 + Math.cos(a) * r2).toFixed(2)}" y2="${(40 + Math.sin(a) * r2).toFixed(2)}"/>`
  }
  return '<svg viewBox="0 0 80 80">' +
    '<circle class="st2" cx="40" cy="40" r="37"/>' +
    '<g class="rot">' + ticks + '</g>' +
    '<circle class="st2" cx="40" cy="40" r="27"/>' +
    '<g class="st"><rect x="21" y="21" width="38" height="38"/>' +
    '<rect x="21" y="21" width="38" height="38" transform="rotate(45 40 40)"/></g>' +
    '<circle class="st2" cx="40" cy="40" r="7"/>' +
    '</svg>'
}

const I = {
  down: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
  dots: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.6-9.3-9A5.2 5.2 0 0 1 12 6.3 5.2 5.2 0 0 1 21.3 12C19 16.4 12 21 12 21z"/></svg>',
  shuf: '<svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor"><path d="M10.6 9.2 7.4 5H3v2h3.4l2.9 3.8zM14 5v2h2.6l-3.4 4.4 1.3 1.6L18.6 7H21v3l3-4-3-4v3zm-1.4 8.4L11.3 15 8.4 19H3v-2h4.4zM17 15.4V13l4 4-4 4v-2.6h-3.4l-2.5-3.3 1.3-1.6 2.2 2.9z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" width="29" height="29" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="29" height="29" fill="currentColor"><path d="M16 6h2v12h-2zm-1.5 6L6 18V6z"/></svg>',
  rep: '<svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z"/></svg>'
}

/**
 * Pecah terjemahan jadi baris ala lirik (per kalimat, panjang wajar).
 * @returns {string[]}
 */
export function pecahBaris (teks, maks = 90) {
  const kasar = String(teks || '').replace(/\s+/g, ' ').trim()
  if (!kasar) return []
  const kalimat = kasar.match(/[^.!?;]+[.!?;]?/g) || [kasar]
  const out = []
  for (let k of kalimat) {
    k = k.trim()
    if (!k) continue
    if (k.length <= maks) { out.push(k); continue }
    let buf = ''
    for (const kata of k.split(' ')) {
      if ((buf + ' ' + kata).trim().length > maks && buf) { out.push(buf.trim()); buf = kata } else buf = (buf + ' ' + kata).trim()
    }
    if (buf) out.push(buf)
  }
  return out.slice(0, 40)
}

/**
 * @param {string} brand nama bot (watermark)
 * @param {object} d {judul, qori, jenis, surahNo, ayatNo, surahNama, arab, latin,
 *                    terjemah, tafsir, url, cadangan, durasi, perintah, perintah2, sumber}
 * @returns {string} payload HTML self-contained
 */
export function murottalHtml (brand, d = {}) {
  const surahNo = Number(d.surahNo) || 1
  const p = PALET[(surahNo - 1) % PALET.length]
  const data = {
    kunci: `${surahNo}:${Number(d.ayatNo) || 1}:${/tilawah/i.test(String(d.jenis || '')) ? 'tilawah' : 'murottal'}`,
    url: String(d.url || ''),
    cadangan: String(d.cadangan || ''),
    durasi: Number(d.durasi) || 0,
    baris: pecahBaris(d.terjemah),
    perintah: String(d.perintah || '').slice(0, 120),
    perintah2: String(d.perintah2 || '').slice(0, 120)
  }
  const judul = String(d.judul || `QS. ${surahNo}:${d.ayatNo || 1}`).slice(0, 120)
  const qori = String(d.qori || '-').slice(0, 120)
  const jenis = String(d.jenis || 'MURATTAL').toUpperCase().slice(0, 20)
  const ayat = d.arab ? `<p class="ar" dir="rtl">${esc(d.arab)}</p>` : ''
  const latin = d.latin ? `<p class="la">${esc(d.latin)}</p>` : ''
  const terjemah = d.terjemah ? `<p class="tr">${esc(d.terjemah)}</p>` : '<p class="tr">Terjemahan tidak tersedia.</p>'
  const tafsir = d.tafsir ? `<p class="taf">📖 ${esc(d.tafsir)}</p>` : ''
  const chip1 = data.perintah ? `<div class="chip" id="cp1">📋 ${esc(data.perintah)}</div>` : ''
  const chip2 = data.perintah2 ? `<div class="chip" id="cp2">📋 ${esc(data.perintah2)}</div>` : ''

  return '<style>' + CSS + '</style>' +
    `<div class="mt" id="mt" style="--c1:${p[0]};--c2:${p[1]}">` +
      `<div class="top anim"><div class="ic">${I.down}</div><div class="mid"><small>${esc(jenis)} · sedang diputar</small><b>${esc(judul)}</b></div><div class="ic">${I.dots}</div></div>` +
      `<div class="cvw anim" id="cvw"><div class="cv">` +
        '<div class="art">' + sampulSvg() + '</div>' +
        '<div class="pg"></div><div class="pg b"></div><div class="pg c"></div>' +
        `<div class="bdg">${esc(jenis)} · QS ${surahNo}:${Number(d.ayatNo) || 1}</div>` +
        '<div class="eqb"><i></i><i></i><i></i><i></i><i></i></div>' +
        `<div class="lyr" id="lyr"><small>Ayat · ${esc(judul)}</small></div>` +
      '</div></div>' +
      `<div class="ttl anim"><div class="t"><b>${esc(judul)}</b><span>${esc(qori)}</span></div><div class="hrt" id="hrt">${I.heart}</div></div>` +
      '<div class="sk anim"><input id="seek" type="range" min="0" max="100" step="0.1" value="0" style="--p:0%"><div class="tm"><span id="cur">0:00</span><span id="tot">0:00</span></div></div>' +
      `<div class="ctl anim"><div class="b dim" id="shf">${I.shuf}</div><div class="b" id="prev">${I.prev}</div><button class="big" id="big" type="button"></button><div class="b" id="next">${I.next}</div><div class="b dim" id="rep">${I.rep}</div></div>` +
      `<div class="ay anim"><div class="lb">Ayat &amp; terjemahan</div>${ayat}${latin}${terjemah}${tafsir}</div>` +
      `<div class="row anim">${chip1}${chip2}</div>` +
      `<div class="bot anim"><span class="pill" id="tgl">AYAT</span><span id="st">MEMUAT</span><span class="pill">${esc(String(d.sumber || 'EVERYAYAH').slice(0, 18))}</span></div>` +
      `<div class="wm">${esc(brand)} • MURATTAL + TERJEMAHAN</div>` +
      '<div class="tst" id="tst"></div>' +
    '</div>' +
    '<audio id="au" preload="auto" playsinline></audio>' +
    '<script>var __MT=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

const P = config.display.prefix
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-A556B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.104 Mobile Safari/537.36'

const SUMBER = {
  murottal: {
    folder: 'Alafasy_128kbps',
    folderKartu: 'Alafasy_64kbps',
    kbps: 128,
    kbpsKartu: 64,
    qori: 'Syaikh Mishary Rashid Alafasy',
    gaya: 'MUROTTAL (merdu, imut hati)'
  },
  tilawah: {
    folder: 'Husary_64kbps',
    folderKartu: 'Husary_64kbps',
    kbps: 64,
    kbpsKartu: 64,
    qori: 'Mahmood Khaleel Al-Husaree',
    gaya: 'TILAWAH (tajwid tegas, tilawah internasional; sekelas tradisi tilawah Mesir — Muammar ZA tidak punya server per-ayat stabil)'
  }
}

/** batas audio yang ditanam di kartu (setting sama dengan .play: playKartuKb) */
const maksTanam = () => (Number(getSettings().playKartuKb) || 430) * 1024

/** "2:74" | "2 74" → { surah: 2, ayat: 74 } */
export function parseAyat (teks) {
  const m = /^(\d{1,3})\s*[.: ]\s*(\d{1,3})$/.exec(String(teks || '').trim())
  if (!m) return null
  return { surah: parseInt(m[1], 10), ayat: parseInt(m[2], 10) }
}

const urlAudio = (dasar, surah, ayat) =>
  `https://everyayah.com/data/${dasar.folder}/${String(surah).padStart(3, '0')}${String(ayat).padStart(3, '0')}.mp3`

async function unduhAudio (url, fetchImpl, batasKB = 0) {
  const f = fetchImpl || globalThis.fetch
  const ctl = new AbortController()
  const t = setTimeout(() => { try { ctl.abort() } catch {} }, 90000)
  try {
    const res = await f(url, { headers: { 'User-Agent': UA }, signal: ctl.signal })
    clearTimeout(t)
    if (!res || !res.ok) throw new Error(`audio tidak ada (HTTP ${res ? res.status : '???'})`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 3000) throw new Error('audio terlalu kecil/rusak')
    if (batasKB && buf.length > batasKB * 1024) throw new Error(`audio ${Math.round(buf.length / 1024)}KB > batas ${batasKB}KB`)
    return buf
  } catch (e) {
    clearTimeout(t)
    throw e
  }
}

const b64 = (buf, mime = 'audio/mpeg') => `data:${mime};base64,${buf.toString('base64')}`
/** perkiraan durasi MP3 CBR dari ukuran berkas (detik) */
export const kiraDurasi = (buf, kbps = 128) => Math.max(1, Math.round((buf.length * 8) / (kbps * 1000)))

/**
 * Siapkan sumber audio untuk KARTU HTML.
 * Urutan: stream web bot (penuh) → kompres ffmpeg → versi 64kbps → kosong
 * (kosong = kartu MODE VISUAL, audio tetap terkirim sebagai pesan WA).
 * @returns {Promise<{url:string, cadangan:string, durasi:number, sumber:string, host:string, catatan:string}>}
 */
export async function siapkanAudioKartu (buf, dasar, surah, ayat, durasi = 0, fetchImpl) {
  const budget = maksTanam()
  const out = { url: '', cadangan: '', durasi: durasi || kiraDurasi(buf, dasar.kbps), sumber: 'EVERYAYAH', host: '', catatan: '' }
  const judul = `QS ${surah}:${ayat}`
  /* 1) stream server bot = audio penuh tanpa batas ukuran kartu */
  try {
    const { daftarkanBuffer, hostStream } = await import('../lib/webaudio.js')
    const st = daftarkanBuffer(judul, dasar.qori, buf, out.durasi)
    if (st?.url) {
      out.url = st.url
      out.host = hostStream() || ''
      out.sumber = `${dasar.kbps}K STREAM`
      out.catatan = 'stream penuh'
    }
  } catch (e) { console.error('[islamiaudio] stream:', e.message) }
  /* 2) tanam base64: asli → kompres ffmpeg → folder 64kbps (→ kompres lagi) */
  try {
    /* batas byte mentah yang masih muat setelah jadi base64 (≈1,33×) */
    const batasTanam = Math.floor(budget * 1.05)
    const targetKompres = Math.floor(budget * 0.75)
    const urlRendah = `https://everyayah.com/data/${dasar.folderKartu}/${String(surah).padStart(3, '0')}${String(ayat).padStart(3, '0')}.mp3`
    let kecil = null
    if (buf.length <= batasTanam) {
      out.cadangan = b64(buf)
      out.catatan = `${out.catatan ? out.catatan + ' · ' : ''}kartu asli ${dasar.kbps}kbps`
    } else {
      try { kecil = await kecilkan(buf, targetKompres, out.durasi) } catch { kecil = null }
      if (kecil) {
        out.cadangan = b64(kecil.buf, kecil.mime)
        out.catatan = `${out.catatan ? out.catatan + ' · ' : ''}kartu ${kecil.codec} ${kecil.kbps}kbps`
      } else {
        const rendah = await unduhAudio(urlRendah, fetchImpl).catch(() => null)
        if (rendah) {
          let k2 = null
          if (rendah.length > batasTanam) { try { k2 = await kecilkan(rendah, targetKompres, out.durasi) } catch { k2 = null } }
          out.cadangan = k2 ? b64(k2.buf, k2.mime) : (rendah.length <= batasTanam ? b64(rendah) : '')
          out.catatan = `${out.catatan ? out.catatan + ' · ' : ''}kartu ${dasar.kbpsKartu}kbps${k2 ? ' ' + k2.codec : ''}`
        }
      }
    }
    if (!out.url && out.cadangan) { out.url = out.cadangan; out.sumber = 'TERNANAM' }
    if (!out.url && !out.cadangan) out.catatan = `${out.catatan ? out.catatan + ' · ' : ''}mode visual`
  } catch (e) { console.error('[islamiaudio] audio kartu:', e.message) }
  return out
}

async function kirimAudioAyat (m, jenis, fetchImpl) {
  const dasar = SUMBER[jenis]
  const p = parseAyat(m.q || (m.args || []).join(' '))
  const judulCmd = jenis === 'murottal' ? `${P}audiomurottal` : `${P}audiotilawah`
  if (!p) {
    return m.reply(
      `🎧 *AUDIO ${jenis.toUpperCase()} AL-QUR'AN*\n\n` +
      `Qori: ${dasar.qori}\nGaya: ${dasar.gaya}\n\n` +
      `Cara: \`${judulCmd} <surah:ayat>\`\n` +
      `Contoh: \`${judulCmd} 2:74\` (Al-Baqarah ayat 74)\n` +
      `• Kartu pemutar ala Spotify: sampul animasi + seek + ulang\n` +
      `• Teks ayat + latin + terjemahan tampil di kartu\n` +
      `• Ketuk sampul → terjemahan menyala per kalimat\n` +
      `• Audio juga dikirim sebagai pesan WA (bisa diputar/diunduh)\n` +
      `• Yang murottal pakai \`${P}audiomurottal\`, yang tilawah \`${P}audiotilawah\``
    )
  }
  const { surah, ayat } = p
  if (surah < 1 || surah > 114) return m.reply('❌ Surah hanya 1–114.')
  if (ayat < 1) return m.reply('❌ Ayat mulai dari 1.')
  await m.react?.('🎧').catch(() => {})

  /* detail surah (nama + jumlah ayat + teks ayat) */
  let detil = null
  try { detil = await surahDetail(surah) } catch { detil = null }
  const jumlahAyat = detil?.ayat || null
  if (jumlahAyat && (ayat < 1 || ayat > jumlahAyat)) {
    return m.reply(`❌ Surah ${detil.nama} (${surah}) hanya ${jumlahAyat} ayat. Contoh: \`${judulCmd} ${surah}:${Math.min(ayat, jumlahAyat)}\``)
  }

  /* teks ayat: dari daftar surah dulu, kalau kosong ambil per-ayat (+ tafsir) */
  let v = (detil?.verses || []).find(x => x.no === ayat) || null
  let tafsir = ''
  if (!v?.ar || !v?.id) {
    try { const a = await ayahDetail(surah, ayat); v = { no: a.no, ar: a.ar, id: a.id, latin: a.latin }; tafsir = truncate(String(a.tafsir || ''), 220) } catch {}
  }

  /* audio 128kbps (dipakai pesan WA + stream kartu) */
  const url = urlAudio(dasar, surah, ayat)
  let buf
  try { buf = await unduhAudio(url, fetchImpl) } catch (e) {
    await m.react?.('❌').catch(() => {})
    return m.reply(`⚠️ Audio ${surah}:${ayat} belum siap (${truncate(String(e?.message || e), 100)}).\nCek langsung: ${url}\nCoba lagi beberapa detik.`)
  }

  const namaSurah = detil?.nama || `Surah ${surah}`
  const judul = `QS. ${namaSurah} · Ayat ${ayat}`
  const A = await siapkanAudioKartu(buf, dasar, surah, ayat, kiraDurasi(buf, dasar.kbps), fetchImpl)
  console.log(`[islamiaudio] ${jenis} ${surah}:${ayat} · audio ${Math.round(buf.length / 1024)}KB · kartu ${A.catatan || '-'} · url ${A.url.startsWith('data:') ? 'dataURI' : (A.url || '-')}`)

  /* 1) kartu HTML tema Spotify */
  let viaHtml = false
  const html = murottalHtml(config.bot.name, {
    judul,
    qori: dasar.qori,
    jenis: jenis === 'murottal' ? 'MURATTAL' : 'TILAWAH',
    surahNo: surah,
    ayatNo: ayat,
    surahNama: namaSurah,
    arab: v?.ar || '',
    latin: v?.latin || '',
    terjemah: v?.id || '',
    tafsir,
    url: A.url,
    cadangan: A.cadangan && A.cadangan !== A.url ? A.cadangan : '',
    durasi: A.durasi,
    perintah: `${judulCmd} ${surah}:${Math.min(ayat + 1, jumlahAyat || ayat + 1)}`,
    perintah2: `${jenis === 'murottal' ? P + 'audiotilawah' : P + 'audiomurottal'} ${surah}:${ayat}`,
    sumber: A.sumber
  })
  try {
    await sendHtmlApp(m.sock, m.jid, {
      title: `🎧 ${truncate(judul, 34)} — ${truncate(dasar.qori, 26)}`,
      html,
      trustedSources: ['hirara.dev', ...(A.host ? [A.host] : [])]
    })
    viaHtml = true
  } catch (e) { console.error('[islamiaudio] html:', e.message) }

  /* 2) audio asli sebagai pesan WhatsApp (bisa diputar / diunduh) */
  let viaAudio = false
  const namaFile = `${surah}-${ayat}-${jenis}.mp3`
  try {
    await m.sock.sendMessage(m.jid, {
      audio: buf, mimetype: 'audio/mpeg', ptt: false, fileName: namaFile,
      contextInfo: { externalAdReply: { title: judul, body: `${dasar.qori} · ${dasar.gaya.split(' (')[0]}`, mediaType: 1, renderLargerThumbnail: false } }
    }, { quoted: m.raw })
    viaAudio = true
  } catch {
    try { await m.sock.sendMessage(m.jid, { audio: buf, mimetype: 'audio/mpeg', ptt: false, fileName: namaFile }, { quoted: m.raw }); viaAudio = true } catch (e) { console.error('[islamiaudio] audio:', e.message) }
  }

  /* 3) teks ringkas + tombol native (webview tidak bisa kirim pesan) */
  const teks =
    `🎧 *${judul}*\n🗣 ${dasar.qori}\n` +
    `⏱️ ±${Math.floor(A.durasi / 60)}:${String(A.durasi % 60).padStart(2, '0')} · 📦 ${Math.round(buf.length / 1024)} KB (${dasar.kbps}kbps)\n\n` +
    (v?.ar ? `${v.ar}\n\n` : '') +
    (v?.id ? `_${truncate(v.id, 420)}_\n\n` : '') +
    (viaHtml
      ? '☝️ Pemutar ala Spotify di atas: ketuk ▶, ketuk sampul untuk terjemahan per kalimat.'
      : '⚠️ Kartu HTML tidak terkirim (client lama) — teks ayat tetap ada di sini.') +
    (viaAudio ? '' : '\n❌ Pesan audio gagal dikirim.') +
    (A.url ? '' : '\nℹ️ Kartu jalan mode visual (audio terlalu besar untuk ditanam) — putar di pesan audio.') +
    `\n🔗 ${url}`

  const tombol = []
  if (jumlahAyat && ayat < jumlahAyat) tombol.push({ text: `⏭️ Ayat ${ayat + 1}`, id: `${judulCmd} ${surah}:${ayat + 1}` })
  if (ayat > 1) tombol.push({ text: `⏮️ Ayat ${ayat - 1}`, id: `${judulCmd} ${surah}:${ayat - 1}` })
  tombol.push({ text: jenis === 'murottal' ? '🎙️ Versi tilawah' : '🎧 Versi murottal', id: `${jenis === 'murottal' ? P + 'audiotilawah' : P + 'audiomurottal'} ${surah}:${ayat}` })
  tombol.push({ text: '📖 Tafsir ayat', id: `${P}tafsir ${surah}:${ayat}` })

  await m.react?.('✅').catch(() => {})
  return m.sendButtons({ title: `🎧 ${judul}`, text: teks, footer: config.bot.footer, buttons: tombol })
    .catch(() => m.reply(teks))
}

export const audioMurottal = {
  command: ['audiomurottal', 'murottal', 'murattal', 'audiomurattal', 'murotal', 'audimurottal'],
  category: 'Islami',
  description: '🎧 Murottal Al-Qur\'an per ayat (Alafasy 128kbps) + kartu Spotify & terjemahan — `.audiomurottal 2:74`',
  limit: 0,
  cooldown: 4,
  contoh: '2:74',
  run: (m, extra) => kirimAudioAyat(m, 'murottal', extra?.fetchImpl)
}

export const audioTilawah = {
  command: ['audiotilawah', 'tilawah', 'audiotelawah', 'telawah', 'audiotilawa', 'tauzwie'],
  category: 'Islami',
  description: '🎧 Tilawah Al-Qur\'an per ayat (Al-Husaree 64kbps) + kartu Spotify & terjemahan — `.audiotilawah 2:74`',
  limit: 0,
  cooldown: 4,
  contoh: '18:10',
  run: (m, extra) => kirimAudioAyat(m, 'tilawah', extra?.fetchImpl)
}

export default { audioMurottal, audioTilawah, parseAyat, murottalHtml, pecahBaris, kiraDurasi, siapkanAudioKartu }
