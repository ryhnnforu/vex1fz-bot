/**
 * ============================================================
 *  lib/kartuuser.js — KARTU MEMBER HTML (v7.8.3 — CANVAS)
 * ------------------------------------------------------------
 *  Kartu identitas interaktif (HTML app via sendHtmlApp) untuk:
 *    • saat user SELESAI .daftar   → varian "baru"  (confetti animasi)
 *    • perintah .profile           → varian "standar"
 *    • user premium                → varian "emas"  (👑)
 *
 *  v7.8.3: LAPORAN "kartu kosong" — versi lama murni HTML/CSS
 *  tanpa <canvas>/<script>, sementara semua game (yang terbukti
 *  tampil) memakai shell canvas. Kartu sekarang DIGAMBAR DI CANVAS
 *  lewat shell() yang sama persis dengan game → dijamin muncul di
 *  client yang bisa memuat game. Data tetap di-escape (JSON).
 * ============================================================
 */
import crypto from 'node:crypto'
import { shell } from './htmlgames.js'

/* ---------- pengaman ---------- */
export const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const potong = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, Math.max(1, n - 1)) + '…' : s }
const bersih = (s, n) => potong(String(s ?? '').replace(/[<>]/g, ''), n)
const inisial = nama => (String(nama || '?').trim().split(/\s+/).slice(0, 2).map(w => [...w][0]).join('') || '?').toUpperCase()

/** EXP yang dibutuhkan untuk naik dari level sekarang (seragam dgn userlab) */
export const expButuh = (level, cfg) =>
  cfg?.leveling?.expPerLevel ? cfg.leveling.expPerLevel(level) : level * level * 100 + 100

/** ID member pendek tapi stabil (JID → 12 heksadesimal, gaya kartu) */
export function memberId (jid) {
  const h = crypto.createHash('sha1').update(String(jid || '')).digest('hex').toUpperCase()
  return `${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`
}

/* ---------- palet tema (dipakai di canvas) ---------- */
export const TEMA = {
  standar: {
    bg: ['#10162b', '#181f3d', '#0d1226'], strip: ['#38bdf8', '#a78bfa', '#f472b6'],
    aksen: '#38bdf8', aksen2: '#a78bfa', lembut: '#93a1c8', chip: 'rgba(56,189,248,0.16)', chipGaris: 'rgba(56,189,248,0.55)',
    label: 'MEMBER CARD'
  },
  emas: {
    bg: ['#2a1c05', '#4a3208', '#241703'], strip: ['#fde047', '#f59e0b', '#fbbf24'],
    aksen: '#fde047', aksen2: '#f59e0b', lembut: '#d8c087', chip: 'rgba(253,224,71,0.15)', chipGaris: 'rgba(253,224,71,0.6)',
    label: 'PREMIUM MEMBER'
  },
  baru: {
    bg: ['#052e2b', '#0b4f3a', '#04211f'], strip: ['#34d399', '#22d3ee', '#a3e635'],
    aksen: '#34d399', aksen2: '#22d3ee', lembut: '#9fd8c0', chip: 'rgba(52,211,153,0.16)', chipGaris: 'rgba(52,211,153,0.6)',
    label: 'KARTU MEMBER BARU'
  }
}

/* CSS tambahan: sembunyikan HUD game (skor/best/progress/status/bar-lb) — ini kartu, bukan game */
const CSS_KARTU = '<style>' +
  '.gd-progress-wrap,.gd-status,.gd-lb,.gd-stats,#pad,.padhint{display:none !important}' +
  'canvas#game{border-radius:22px !important;border-width:0 !important;background:transparent !important}' +
  '.gd-body{padding:6px 8px 8px !important}' +
  'canvas#game{width:100% !important;min-height:70vh;object-fit:contain}' +
  '.gd-wm{padding-bottom:6px}' +
  '</style>'

const KARTU_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var D = (typeof __KARTU !== 'undefined') ? __KARTU : {};
  var T = D.tema || {};
  var t0 = 0;
  var KONF = [];
  var WARNA_KONF = ['#fde047', '#f472b6', '#34d399', '#22d3ee', '#a78bfa', '#fb923c'];
  if (D.baru) for (var i = 0; i < 44; i++) KONF.push({ x: Math.random() * W, y: -Math.random() * H, vy: 1.2 + Math.random() * 2.2, vx: (Math.random() - 0.5) * 0.8, r: Math.random() * Math.PI, w: WARNA_KONF[i % 6], s: 6 + Math.random() * 6 });

  function F (size, weight, fam) { ctx.font = (weight || '700') + ' ' + size + "px " + (fam || "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"); }
  function txt (t, x, y, size, warna, weight, align, fam) { F(size, weight, fam); ctx.fillStyle = warna || '#fff'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); }
  function rr (x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function potong (s, maxW, size, weight) { F(size, weight); s = String(s); if (ctx.measureText(s).width <= maxW) return s; while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1); return s + '…'; }
  function gradStrip (x, y, w, h) { var g = ctx.createLinearGradient(x, y, x + w, y); g.addColorStop(0, T.strip[0]); g.addColorStop(0.5, T.strip[1]); g.addColorStop(1, T.strip[2]); return g; }
  function chip (label, x, y) {
    F(13, '800'); var w = ctx.measureText(label).width + 22;
    rr(x, y, w, 28, 14); ctx.fillStyle = T.chip; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = T.chipGaris; ctx.stroke();
    txt(label, x + w / 2, y + 19, 13, '#fff', '800', 'center');
    return w + 8;
  }
  function sel (k, v, x, y, w, h) {
    rr(x, y, w, h, 16); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = T.chipGaris; ctx.stroke();
    txt(k, x + 16, y + 26, 12, T.lembut, '900');
    txt(potong(v, w - 32, 22, '900'), x + 16, y + 58, 22, '#fff', '900');
  }

  function gambar () {
    t0 += 1;
    ctx.clearRect(0, 0, W, H);
    /* kartu */
    rr(0, 0, W, H, 30); ctx.save(); ctx.clip();
    var bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, T.bg[0]); bg.addColorStop(0.46, T.bg[1]); bg.addColorStop(1, T.bg[2]);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    /* lingkaran hias */
    ctx.globalAlpha = 0.10; ctx.fillStyle = T.aksen; ctx.beginPath(); ctx.arc(W - 70, 90, 150, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = T.aksen2; ctx.beginPath(); ctx.arc(60, H - 90, 130, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    /* strip atas & bawah */
    ctx.fillStyle = gradStrip(0, 0, W, 10); ctx.fillRect(0, 0, W, 10); ctx.fillRect(0, H - 10, W, 10);

    /* kepala: brand + label */
    txt(D.brand, 34, 50, 15, T.lembut, '900');
    F(13, '900'); var lw = ctx.measureText(D.judul).width + 30;
    rr(W - 34 - lw, 30, lw, 30, 15); ctx.fillStyle = T.chip; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = T.chipGaris; ctx.stroke();
    txt(D.judul, W - 34 - lw / 2, 50, 13, T.aksen, '900', 'center');

    var y = 82;
    if (D.baru) {
      rr(34, y, W - 68, 46, 14); var pg = ctx.createLinearGradient(34, 0, W - 34, 0); pg.addColorStop(0, '#a7f3d0'); pg.addColorStop(1, '#67e8f9'); ctx.fillStyle = pg; ctx.fill();
      txt('🎉 SELAMAT, KAMU RESMI TERDAFTAR — +' + D.bonusLimit + ' LIMIT', W / 2, y + 30, 16, '#06281f', '900', 'center');
      y += 64;
    }

    /* avatar + nama */
    var ax = 34 + 52, ay = y + 60;
    var cg = ctx.createLinearGradient(ax - 52, ay - 52, ax + 52, ay + 52); cg.addColorStop(0, T.strip[0]); cg.addColorStop(1, T.strip[1]);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18; ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(ax, ay, 54, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#0d1226'; ctx.beginPath(); ctx.arc(ax, ay, 47, 0, Math.PI * 2); ctx.fill();
    txt(D.inisial, ax, ay + 13, 36, '#fff', '900', 'center');
    if (D.premium) txt('👑', ax + 30, ay - 34, 30, '#fff', '900', 'center', "'Segoe UI Emoji','Noto Color Emoji',sans-serif");

    var nx = 34 + 124;
    txt(potong(D.nama, W - nx - 34, 32, '900'), nx, y + 40, 32, '#fff', '900');
    txt('wa.me/' + D.nomor, nx, y + 66, 15, T.lembut, '700');
    var cx = nx, cy = y + 82;
    for (var i = 0; i < D.chips.length; i++) {
      F(13, '800'); var cw = ctx.measureText(D.chips[i]).width + 30;
      if (cx + cw > W - 34) { cx = nx; cy += 36; }
      cx += chip(D.chips[i], cx, cy);
    }
    y = cy + 54;

    /* EXP */
    txt('EXP LEVEL ' + D.level, 34, y, 13, T.lembut, '900');
    txt(D.expTeks, W - 34, y, 13, T.lembut, '900', 'right');
    rr(34, y + 10, W - 68, 16, 8); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
    var isi = Math.max(10, (W - 68) * D.persen / 100);
    rr(34, y + 10, isi, 16, 8); ctx.fillStyle = gradStrip(34, 0, W - 68, 0); ctx.fill();
    y += 46;

    /* grid 2×2 */
    var gw = (W - 68 - 14) / 2, gh = 78;
    sel(D.sel[0][0], D.sel[0][1], 34, y, gw, gh);
    sel(D.sel[1][0], D.sel[1][1], 34 + gw + 14, y, gw, gh);
    sel(D.sel[2][0], D.sel[2][1], 34, y + gh + 14, gw, gh);
    sel(D.sel[3][0], D.sel[3][1], 34 + gw + 14, y + gh + 14, gw, gh);
    y += gh * 2 + 14 + 30;

    if (D.bio) { txt('“' + potong(D.bio, W - 68, 15, '600') + '”', W / 2, y, 15, T.lembut, '600', 'center'); y += 26; }

    /* kaki: member id + barcode */
    var ky = H - 96;
    ctx.setLineDash([6, 6]); ctx.strokeStyle = T.chipGaris; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(34, ky); ctx.lineTo(W - 34, ky); ctx.stroke(); ctx.setLineDash([]);
    txt(D.id, 34, ky + 40, 22, T.aksen, '900');
    txt('MEMBER ID · ' + D.brand, 34, ky + 62, 11, T.lembut, '800');
    var bx = W - 34, id = D.id.replace(/-/g, '');
    for (var k = id.length - 1; k >= 0; k--) { var v = parseInt(id[k], 16); var bh = 14 + (isNaN(v) ? 10 : v) * 1.6; var bw = 'ACHF'.indexOf(id[k]) >= 0 ? 3 : 5; bx -= bw + 3; ctx.fillStyle = T.lembut; ctx.fillRect(bx, ky + 60 - bh, bw, bh); }

    /* confetti animasi */
    if (D.baru) {
      for (var j = 0; j < KONF.length; j++) {
        var p = KONF[j]; p.y += p.vy; p.x += p.vx + Math.sin((t0 + j) / 20) * 0.6; p.r += 0.05;
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.w; ctx.globalAlpha = 0.85; ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); ctx.restore();
      }
    }
    ctx.restore();
    A.state = { kartu: true, nama: D.nama, premium: !!D.premium, baru: !!D.baru, level: D.level, over: false };
  }
  function loop () { gambar(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
`

const angka = n => (Number(n) || 0).toLocaleString('id-ID')

/**
 * Bangun HTML kartu member (canvas app).
 * @param {string} brand nama bot
 * @param {object} d
 *  { nama, nomor, umur, level, exp, butuh, limit, uang, premium, premiumSisa,
 *    terdaftar, sejak, bio, jid, baru (boolean), judulKartu?, bonusLimit?, limitAngka? }
 * @returns {string} html self-contained
 */
export function kartuMemberHtml (brand = 'THERYHANN!', d = {}) {
  const prem = !!d.premium
  const kunci = d.baru ? 'baru' : prem ? 'emas' : 'standar'
  const T = TEMA[kunci]
  const id = memberId(d.jid || d.nomor || 'anon')
  const butuh = Math.max(1, Number(d.butuh) || 100)
  const expDlm = Math.max(0, Number(d.exp) || 0)
  const persen = Math.max(2, Math.min(100, Math.round((expDlm / butuh) * 100)))
  const level = Math.max(1, Number(d.level) || 1)
  const judul = bersih(d.judulKartu || (d.baru ? 'PENDAFTARAN BERHASIL' : T.label), 26)

  const chips = [
    `Lv.${level}`,
    prem ? '👑 PREMIUM' : '🆓 GRATIS',
    d.terdaftar ? '✅ TERVERIFIKASI' : '⏳ BELUM VERIFIKASI'
  ]
  if (prem && d.premiumSisa) chips.push('⏳ ' + bersih(d.premiumSisa, 20))

  const data = {
    brand: bersih(brand, 18).toUpperCase(),
    judul,
    tema: T,
    baru: !!d.baru,
    premium: prem,
    bonusLimit: angka(d.bonusLimit ?? 10),
    nama: bersih(d.nama || 'Tanpa Nama', 40),
    inisial: bersih(inisial(d.nama), 3),
    nomor: String(d.nomor || '-').replace(/[^0-9]/g, '') || '-',
    chips,
    level,
    expTeks: `${angka(expDlm)} / ${angka(butuh)}`,
    persen,
    sel: [
      ['💠 LIMIT', prem && !d.limitAngka ? '♾️ Unlimited' : angka(d.limit)],
      ['💰 UANG', angka(d.uang)],
      ['🎂 UMUR', d.umur ? angka(d.umur) + ' th' : '—'],
      ['🗓 MEMBER SEJAK', bersih(d.sejak || '—', 16)]
    ],
    bio: bersih(d.bio || '', 90),
    id
  }
  /* JSON aman: tutup </script> tidak mungkin lolos */
  const js = '  var __KARTU = ' + JSON.stringify(data).replace(/</g, '\\u003c') + ';\n' + KARTU_JS
  const html = shell('Kartu Member', brand, js, {
    w: 640, h: d.baru ? 760 : 700, maxw: 480, sub: kunci === 'emas' ? 'PREMIUM' : 'MEMBER', pad: '',
    palette: [T.aksen, T.aksen2], hint: ''
  })
  /* penanda tema (dipakai test & debug) + CSS penyembunyi HUD */
  return CSS_KARTU + '<!-- kartu:' + kunci + ' ' + T.bg[0] + ' -->' + html
}

export default { kartuMemberHtml, memberId, expButuh, esc, TEMA }
