/**
 * lib/prankhtml.js — 💀 .hack PRANK "KAMU TELAH DI-HACK" (v7.10.0)
 * ------------------------------------------------------------------
 *  Kartu HTML yang meniru dialog JavaScript alert/prompt Android
 *  (referensi screenshot pengguna): kotak gelap, judul "JavaScript",
 *  pesan pengirim, kolom isian, tombol Batal / Oke. Sebelum dialog,
 *  ada "layar terminal" hijau ala hacker yang mengetik sendiri.
 *  Password benar → layar "TERBUKA" + pesan lega; salah → goyang + hitung
 *  percobaan; Batal → dialog muncul lagi (tak bisa ditutup, prank).
 *  Semua di dalam kartu — tidak menyentuh HP siapa pun (hanya prank).
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:#000;font-family:Roboto,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;color:#fff;min-height:100vh}
.wrap{position:relative;max-width:520px;margin:0 auto;min-height:100vh;height:100vh;overflow:hidden;background:#050505}
.term{position:absolute;inset:0;padding:16px 14px;font:13px/1.5 "Courier New",monospace;color:#3bff6e;white-space:pre-wrap;word-break:break-all;opacity:.85;overflow:hidden}
.term .k{color:#ff4d4d}
.scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 2px,transparent 2px 4px);pointer-events:none}
.dim{position:absolute;inset:0;background:rgba(0,0,0,.55);display:none}
.dim.on{display:block}
.dlg{position:absolute;left:14px;right:14px;top:50%;transform:translateY(-50%);background:#1f2427;border-radius:6px;padding:22px 22px 14px;box-shadow:0 14px 40px rgba(0,0,0,.7);display:none}
.dlg.on{display:block}
.dlg h1{font-size:26px;font-weight:500;color:#fff;margin-bottom:12px}
.dlg p{font-size:19px;line-height:1.35;color:#cfd3d6;white-space:pre-wrap;word-break:break-word}
.dlg input{width:100%;margin-top:34px;background:transparent;border:0;border-bottom:1.5px solid #9aa0a6;color:#fff;font-size:18px;padding:6px 2px;outline:none;caret-color:#8ab4f8}
.dlg input:focus{border-bottom-color:#8ab4f8}
.dlg .bt{display:flex;justify-content:flex-end;gap:38px;margin-top:22px;padding:6px 8px 4px}
.dlg .bt span{font-size:21px;color:#fff;letter-spacing:.2px}
.dlg .bt span:active{opacity:.6}
.dlg .err{color:#ff6b6b;font-size:13px;margin-top:8px;min-height:16px}
.dlg.shake{animation:sh .35s}
@keyframes sh{0%,100%{transform:translateY(-50%) translateX(0)}25%{transform:translateY(-50%) translateX(-8px)}75%{transform:translateY(-50%) translateX(8px)}}
.ok{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;background:radial-gradient(circle at 50% 30%,#0b3d20,#020b05)}
.ok.on{display:flex}
.ok .ic{width:96px;height:96px;border-radius:50%;background:#1ed760;display:flex;align-items:center;justify-content:center;margin-bottom:18px;box-shadow:0 0 40px rgba(30,215,96,.5)}
.ok h2{font-size:24px;margin-bottom:8px}
.ok p{color:#b7f5cc;font-size:15px;line-height:1.45;white-space:pre-wrap}
.ok small{margin-top:26px;color:#7fbf95;font-size:11px;letter-spacing:1px}
.hint{position:absolute;bottom:10px;left:0;right:0;text-align:center;font-size:10px;color:#333;letter-spacing:1px}
`

const JS = `
(function(){
  var D = __HK, term = document.getElementById('term'), dim = document.getElementById('dim'), dlg = document.getElementById('dlg'), inp = document.getElementById('inp'), err = document.getElementById('err'), ok = document.getElementById('ok'), okp = document.getElementById('okp');
  var baris = D.log, i = 0, coba = 0;
  function ketik () { if (i >= baris.length) { setTimeout(buka, 500); return; } var b = baris[i++]; var d = document.createElement('div'); if (/HACK|ROOT|ACCESS|TERKUNCI/.test(b)) d.className = 'k'; d.textContent = b; term.appendChild(d); term.scrollTop = term.scrollHeight; setTimeout(ketik, 90 + Math.random() * 220); }
  function buka () { dim.className = 'dim on'; dlg.className = 'dlg on'; try { inp.focus(); } catch (e) {} }
  function salah () { coba++; err.textContent = 'Password salah (' + coba + 'x)' + (coba >= D.petunjukSetelah && D.petunjuk ? ' · petunjuk: ' + D.petunjuk : ''); dlg.className = 'dlg on shake'; setTimeout(function () { dlg.className = 'dlg on'; }, 400); inp.value = ''; try { navigator.vibrate && navigator.vibrate(120); } catch (e) {} }
  function cek () { var v = (inp.value || '').trim(); if (v && v.toLowerCase() === D.pass.toLowerCase()) { dim.className = 'dim'; dlg.className = 'dlg'; ok.className = 'ok on'; okp.textContent = D.sukses.replace('{coba}', coba + 1); } else salah(); }
  document.getElementById('oke').onclick = cek;
  inp.onkeydown = function (e) { if (e.key === 'Enter') cek(); };
  document.getElementById('batal').onclick = function () { dlg.className = 'dlg'; setTimeout(function () { err.textContent = D.batal; dlg.className = 'dlg on shake'; setTimeout(function () { dlg.className = 'dlg on'; }, 400); }, 350); };
  setTimeout(ketik, 400);
})();
`

/**
 * @param {string} brand
 * @param {object} o { pesan, pass, petunjuk, sukses, batal, target }
 */
export function hackHtml (brand, o = {}) {
  const pesan = String(o.pesan || 'kamuh terkenax hecks ☠️, apah katax-katax terahir mu😈').slice(0, 300)
  const pass = String(o.pass || 'maaf').slice(0, 40)
  const target = String(o.target || 'perangkat ini').slice(0, 40)
  const host = (brand || 'bot').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bot'
  const data = {
    pass,
    petunjuk: String(o.petunjuk || '').slice(0, 80),
    petunjukSetelah: 3,
    sukses: String(o.sukses || 'Fiuh… sistem dipulihkan 😌\nIni cuma PRANK dari temanmu. Datamu aman.\n(butuh {coba} percobaan)').slice(0, 300),
    batal: String(o.batal || 'Tidak bisa dibatalkan 😈').slice(0, 80),
    log: [
      `root@${host}:~# ./exploit --target "${target}"`,
      '[+] scanning ports ... 22 80 443 5555 OPEN',
      '[+] bypassing firewall ........ OK',
      '[+] dumping /data/data/com.whatsapp/databases',
      '    msgstore.db ............ 100%',
      '    wa.db .................. 100%',
      '[+] uploading contacts (412) .... OK',
      '[+] uploading photos (1.284) .... OK',
      '[!] ACCESS GRANTED — ROOT SHELL',
      '[!] DEVICE TERKUNCI — masukkan password untuk membuka'
    ]
  }
  return '<style>' + CSS + '</style>' +
    '<div class="wrap">' +
      '<div class="term" id="term"></div><div class="scan"></div>' +
      '<div class="dim" id="dim"></div>' +
      '<div class="dlg" id="dlg"><h1>JavaScript</h1><p>' + esc(pesan) + '</p>' +
        '<input id="inp" type="text" autocomplete="off" autocapitalize="off" placeholder="">' +
        '<div class="err" id="err"></div>' +
        '<div class="bt"><span id="batal">Batal</span><span id="oke">Oke</span></div></div>' +
      '<div class="ok" id="ok"><div class="ic"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#04210f" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg></div><h2>TERBUKA 🔓</h2><p id="okp"></p><small>' + esc(brand) + ' • PRANK MODE</small></div>' +
      '<div class="hint">' + esc(brand) + ' • hanya prank, tidak ada yang diretas</div>' +
    '</div>' +
    '<script>var __HK=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

export default { hackHtml }
