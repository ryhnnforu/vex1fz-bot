/**
 * lib/kartuwelcome.js — KARTU WELCOME / GOODBYE sistem HTML (v7.9.1)
 * ------------------------------------------------------------------
 *  Digambar di <canvas> lewat shell() yang sama dengan semua game/kartu
 *  member, jadi tampil di client mana pun game tampil. Animasi confetti
 *  (welcome) / hujan bintang redup (goodbye), avatar inisial, nama,
 *  nama grup, jumlah member, waktu, pesan kustom.
 */
import { shell } from './htmlgames.js'

const bersih = (s, n = 60) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').slice(0, n)
const inisial = n => (String(n || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || '?').toUpperCase()

/* palet mengikuti sistem kartu .profile (lib/kartuuser.js TEMA): welcome = 'baru' (hijau), leave = 'standar' (biru), promote = 'emas' */
const TEMA_W = {
  welcome: { bg: ['#052e2b', '#0b4f3a', '#04211f'], a: '#34d399', b: '#22d3ee', label: 'SELAMAT DATANG', ikon: '👋', kotak: 'BERGABUNG DI GRUP', judul: 'Selamat Datang', sub: 'WELCOME' },
  leave: { bg: ['#10162b', '#181f3d', '#0d1226'], a: '#38bdf8', b: '#a78bfa', label: 'SAMPAI JUMPA', ikon: '🚪', kotak: 'MENINGGALKAN GRUP', judul: 'Sampai Jumpa', sub: 'GOODBYE' },
  promote: { bg: ['#2a1c05', '#4a3208', '#241703'], a: '#fde047', b: '#f59e0b', label: 'NAIK JADI ADMIN', ikon: '🎉', kotak: 'ADMIN BARU DI GRUP', judul: 'Selamat, Admin Baru!', sub: 'PROMOTE' },
  demote: { bg: ['#2a1a0b', '#4a2a0f', '#170f06'], a: '#fb923c', b: '#94a3b8', label: 'TURUN JABATAN', ikon: '📉', kotak: 'BUKAN ADMIN LAGI DI GRUP', judul: 'Turun Jabatan', sub: 'DEMOTE' }
}

const CSS_W = '<style>' +
  '.gd-progress-wrap,.gd-status,.gd-lb,.gd-stats,#pad,.padhint{display:none !important}' +
  'canvas#game{border-radius:22px !important;border-width:0 !important;background:transparent !important;max-height:none !important;min-height:70vh;object-fit:contain}' +
  '.gd-body{padding:8px 10px 12px !important}' +
  '</style>'

const W_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var D = (typeof __WEL !== 'undefined') ? __WEL : {};
  var T = D.tema || {}; var t = 0;
  var AV = null; if (D.avatar) { AV = new Image(); AV.onerror = function(){ AV = null; }; AV.src = D.avatar; }
  var part = []; for (var i = 0; i < 70; i++) part.push({ x: Math.random() * W, y: Math.random() * H, vy: 0.6 + Math.random() * 1.6, vx: (Math.random() - 0.5) * 0.8, s: 4 + Math.random() * 6, r: Math.random() * 6.28, w: [T.a, T.b, '#fff', '#fde047', '#f472b6'][i % 5] });
  function rr (x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function fit (txt, maxW, size, weight) { var s = size; do { ctx.font = (weight || '900') + ' ' + s + 'px "Segoe UI", Roboto, sans-serif'; s -= 2; } while (ctx.measureText(txt).width > maxW && s > 12); }
  function draw () {
    t++;
    var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, T.bg[0]); g.addColorStop(0.5, T.bg[1]); g.addColorStop(1, T.bg[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* lingkaran cahaya */
    var rg = ctx.createRadialGradient(W * 0.5, H * 0.32, 10, W * 0.5, H * 0.32, W * 0.6); rg.addColorStop(0, T.a + '44'); rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    /* confetti / bintang */
    for (var i = 0; i < part.length; i++) { var p = part[i]; p.y += p.vy; p.x += p.vx + Math.sin((t + i) / 20) * 0.4; p.r += 0.05; if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = D.jenis === 'welcome' || D.jenis === 'promote' ? 0.9 : 0.35; ctx.fillStyle = p.w; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
    ctx.globalAlpha = 1;
    /* pita label atas */
    ctx.fillStyle = T.a; rr(W / 2 - 150, 26, 300, 34, 17); ctx.fill();
    ctx.fillStyle = '#0b1020'; ctx.font = '900 15px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(T.ikon + '  ' + D.label, W / 2, 43);
    /* avatar lingkaran */
    var cx = W / 2, cy = 150, R = 66;
    ctx.save(); ctx.shadowColor = T.a; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(cx, cy, R + 6, 0, 6.28); ctx.fillStyle = T.b; ctx.fill(); ctx.restore();
    var ag = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); ag.addColorStop(0, T.a); ag.addColorStop(1, T.b);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.fillStyle = ag; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 48px "Segoe UI", sans-serif'; ctx.fillText(D.inisial, cx, cy + 2);
    /* nama */
    ctx.fillStyle = '#fff'; fit(D.nama, W - 60, 34, '900'); ctx.fillText(D.nama, W / 2, 250);
    ctx.fillStyle = T.a; ctx.font = '700 15px "Segoe UI", sans-serif'; ctx.fillText(D.nomor && D.nomor !== '-' ? '@' + D.nomor : (D.jenis === 'promote' ? 'Admin Grup' : D.jenis === 'demote' ? 'Member' : 'Member Baru'), W / 2, 278);
    /* kotak grup */
    rr(30, 304, W - 60, 74, 16); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill(); ctx.strokeStyle = T.a + '66'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.fillText(T.kotak || 'BERGABUNG DI GRUP', W / 2, 322);
    ctx.fillStyle = '#fff'; fit(D.grup, W - 100, 22, '900'); ctx.fillText(D.grup, W / 2, 350);
    /* statistik */
    var kolom = [['👥', 'MEMBER', D.member], ['🕒', 'WAKTU', D.waktu], ['📅', 'TANGGAL', D.tanggal]];
    var kw = (W - 60 - 20) / 3;
    for (var k = 0; k < 3; k++) { var kx = 30 + k * (kw + 10), ky = 394;
      rr(kx, ky, kw, 62, 14); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill();
      ctx.font = '18px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(kolom[k][0], kx + kw / 2, ky + 16);
      ctx.font = '700 9px "Segoe UI", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillText(kolom[k][1], kx + kw / 2, ky + 33);
      ctx.font = '900 13px "Segoe UI", sans-serif'; ctx.fillStyle = T.a; ctx.fillText(String(kolom[k][2]), kx + kw / 2, ky + 49); }
    /* pesan */
    if (D.pesan) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '600 13px "Segoe UI", sans-serif';
      var kata = D.pesan.split(' '), baris = [], cur = '';
      for (var w = 0; w < kata.length; w++) { var uji = cur ? cur + ' ' + kata[w] : kata[w]; if (ctx.measureText(uji).width > W - 70) { baris.push(cur); cur = kata[w]; } else cur = uji; } if (cur) baris.push(cur);
      for (var b = 0; b < Math.min(3, baris.length); b++) ctx.fillText(baris[b], W / 2, 486 + b * 19); }
    /* footer */
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '700 10px "Segoe UI", sans-serif'; ctx.fillText(D.brand + '  •  WhatsApp Bot', W / 2, H - 16);
    ctx.textBaseline = 'alphabetic';
    requestAnimationFrame(draw);
  }
  A.setScore && A.setScore(0); draw();
`

/**
 * @param {string} brand
 * @param {object} d { jenis: 'welcome'|'leave'|'promote'|'demote', nama, nomor, grup, member, waktu, tanggal, pesan }
 */
export function kartuWelcomeHtml (brand = 'THERYHANN!', d = {}) {
  const jenis = TEMA_W[d.jenis] ? d.jenis : 'welcome'
  const T = TEMA_W[jenis]
  const data = {
    jenis, tema: T, label: bersih(d.label || T.label, 26), brand: bersih(brand, 18).toUpperCase(),
    nama: bersih(d.nama || 'Member', 40), inisial: inisial(d.nama), nomor: String(d.nomor || '').replace(/\D/g, '') || '-',
    grup: bersih(d.grup || 'Grup', 50), member: d.member ?? '-', waktu: bersih(d.waktu || '', 10), tanggal: bersih(d.tanggal || '', 14),
    pesan: bersih(d.pesan || '', 160), avatar: /^https?:\/\//.test(String(d.avatar || '')) ? String(d.avatar) : ''
  }
  const js = '  var __WEL = ' + JSON.stringify(data).replace(/</g, '\\u003c') + ';\n' + W_JS
  const html = shell(T.judul, brand, js, { w: 480, h: 560, maxw: 480, sub: T.sub, pad: '', palette: [T.a, T.b], hint: '', tema: 'glass' })
  return CSS_W + '<!-- welcome:' + jenis + ' -->' + html
}

export default { kartuWelcomeHtml }
