/**
 * ============================================================
 *  lib/webgame.js — GAME CERITA VERSI WEB ("Mainkan Sekarang")
 * ------------------------------------------------------------
 *  Game cerita (lib/htmlgames15*.js) di-host sebagai HALAMAN WEB
 *  oleh server HTTP bot (index.js). Bot mengirim kartu
 *  "DETAIL MINIGAME" + tombol URL ▶ Mainkan Sekarang → game
 *  terbuka di pratinjau/browser dalam WhatsApp.
 *
 *  Rute:
 *   GET  /g/<token>          halaman game (episode sesuai token)
 *   POST /g/<token>/tamat    dipanggil game saat episode tamat →
 *                            progres naik + bot kirim tombol
 *                            episode berikutnya ke chat asal
 *   POST /g/<token>/like     ❤️ like
 *   GET  /g                  daftar game (halaman arcade web)
 *
 *  Token = id acak yang memetakan {user, jid, game, ep}. Disimpan
 *  di database 'webgame' (kadaluarsa 3 hari). Statistik per game:
 *  views / plays / likes / rilis.
 * ============================================================
 */
import { config } from '../config.js'
import { ARCADE_9, sisipEp } from './htmlgames15.js'
import { loadDB, saveDB, getSettings } from './database.js'

const DBN = 'webgame'
const db = () => loadDB(DBN, { token: {}, stat: {}, meta: {} })
const BY_ID = Object.fromEntries(ARCADE_9.map(g => [g.id, g]))
const acak = n => { let s = ''; const c = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ'; for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s }
const brand = () => config.bot?.name || 'THERYHANN!'

/** kategori tampilan ala kartu minigame */
export const KATEGORI = {
  rumah13: 'HORROR 3D', desapixel: 'PIXEL HORROR', droneview: 'PSP', neondrift: 'RACING 3D',
  neonrunner: 'ARCADE', lautdalam: 'ADVENTURE', penjagakuil: 'STRATEGY', kurirluar: 'ARCADE',
  detektifkota: 'MYSTERY', sawahnusantara: 'SIMULATION', gladiator: 'ACTION', pilotdrone: 'RACING',
  penyihirrune: 'PUZZLE', kotasenja: 'PUZZLE', mercusuar: 'STORY · NAUTICAL',
  kampungmati: 'HORROR 3D'
}

/* ---------------- URL publik ---------------- */
export function baseUrl () {
  const s = getSettings()
  const u = s.webUrl || process.env.PUBLIC_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN : '') ||
    (process.env.RAILWAY_STATIC_URL ? 'https://' + process.env.RAILWAY_STATIC_URL : '') ||
    (process.env.RENDER_EXTERNAL_URL || '')
  return String(u || '').replace(/\/+$/, '')
}
export function webAktif () { return !!baseUrl() && !!process.env.PORT }

/* ---------------- statistik ---------------- */
export function stat (gameId) {
  const d = db()
  const s = d.stat[gameId] || (d.stat[gameId] = { views: 0, plays: 0, likes: 0, rilis: Date.now(), likedBy: [] })
  return s
}
function tglRilis (ms) {
  const t = new Date(ms + 7 * 3600e3) // WIB
  const p = n => String(n).padStart(2, '0')
  return `${p(t.getUTCDate())}/${p(t.getUTCMonth() + 1)}/${t.getUTCFullYear()} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())}`
}

/* ---------------- token ---------------- */
export function buatToken ({ user, jid, game, ep, max, nama, kunci = '', prefix = '.' }) {
  const d = db()
  // bersihkan kadaluarsa
  const now = Date.now()
  for (const k of Object.keys(d.token)) if (now - (d.token[k].t || 0) > 3 * 86400e3) delete d.token[k]
  const tok = acak(10)
  d.token[tok] = { user, jid, game, ep, max, nama: nama || 'Pemain', t: now, nonce: acak(8), selesai: false, kunci, prefix }
  saveDB(DBN)
  return tok
}
export function ambilToken (tok) { const d = db(); return d.token[tok] || null }

/* ---------------- teks kartu ala "DETAIL MINIGAME" ---------------- */
export function teksDetail (g, ep, opt = {}) {
  const s = stat(g.id)
  const author = opt.author || config.owner?.name || brand()
  return `*${g.title}*\n\n🎮 *DETAIL MINIGAME*\n\n` +
    `• *Judul:* ${g.title}${g.episode > 1 ? ` — Episode ${ep}/${g.episode}` : ''}\n` +
    `• *Kategori:* ${KATEGORI[g.id] || 'STORY'}\n` +
    `• *Author:* ${author}\n` +
    `• *Credits:* ${opt.credits || '-'}\n` +
    `• *Deskripsi:* ${g.ket}\n` +
    `• *Statistik:* 👁️ ${s.views} views | ▶️ ${s.plays} plays | ❤️ ${s.likes} likes\n` +
    `• *Tanggal Rilis:* ${tglRilis(s.rilis)}`
}

/* ---------------- halaman web ---------------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function halamanGame (tok, info, g) {
  const html = sisipEp(g.html(brand(), { ep: info.ep, max: info.max, nonce: info.nonce, kunci: info.kunci, prefix: info.prefix }), { ep: info.ep, max: info.max, nonce: info.nonce, kunci: info.kunci, prefix: info.prefix })
  // hook: saat tamat (menang) → POST ke server; ganti kotak kode dengan status kirim otomatis
  /* v7.32.0 — SEMUA game memanggil tamat(...) (bukan __tamat), jadi hook lama tidak pernah
     jalan → progres web tidak tersimpan ("error key episode berikutnya"). Sekarang KEDUANYA
     dibungkus + kirim diulang 3x bila jaringan gagal. */
  const hook = `<script>(function(){var T=${JSON.stringify(tok)},asli=window.__tamat,sent=false,coba=0;
var K=${JSON.stringify(info.kunci || '')},PX=${JSON.stringify(info.prefix || '.')};var hasil=null;function tulis(){var k=document.querySelector('.kode');if(k&&hasil&&!k.getAttribute('data-w')){k.setAttribute('data-w','1');k.innerHTML='<small>PROGRES TERSIMPAN OTOMATIS</small><b style="font-size:18px;letter-spacing:1px">'+(hasil.pesan||'✔ Tersimpan')+'</b><small>'+(hasil.next?'Cek chat WhatsApp — bot sudah mengirim tombol <b>Episode '+hasil.next+'</b> atau ketik <b>'+PX+'episode'+hasil.next+' '+K+'</b>.':'Kembali ke chat WhatsApp.')+'</small>'}}
function kirim(ep,skor){if(sent)return;sent=true;fetch('/g/'+T+'/tamat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ep:ep,skor:skor||0})}).then(function(r){return r.json().then(function(j){return{r:r,j:j}})}).then(function(x){if(!x.r.ok&&coba<3){coba++;sent=false;setTimeout(function(){kirim(ep,skor)},1500);return}hasil=x.j;tulis()}).catch(function(){if(coba<3){coba++;sent=false;setTimeout(function(){kirim(ep,skor)},1500)}else{var k=document.querySelector('.kode small');if(k)k.innerHTML='Kirim kode ini ke chat (simpan otomatis gagal)'}})}
setInterval(tulis,400);
function bungkus(menang,skor,cat){try{asli(menang,skor,cat)}catch(e){}if(menang){var ep=(window.__EP||{}).ep||1;setTimeout(function(){kirim(ep,skor)},200)}}
window.__tamat=bungkus;try{window.tamat=bungkus}catch(e){}
var like=document.createElement('div');like.id='wlike';like.innerHTML='❤️ Suka';like.style.cssText='position:absolute;left:50%;transform:translateX(-50%);bottom:0;z-index:9;background:rgba(0,0,0,.6);color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:20px;padding:5px 12px;font:600 12px sans-serif;cursor:pointer';
like.onclick=function(){fetch('/g/'+T+'/like',{method:'POST'}).then(function(r){return r.json()}).then(function(j){like.innerHTML='❤️ '+(j.likes||0)+(j.sudah?' ✓':'')})};
var w=document.querySelector('.wrap');if(w)w.appendChild(like);
})();</script>`
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><title>${esc(g.title)} — Episode ${info.ep} · ${esc(brand())}</title>` +
    `<meta property="og:title" content="${esc(g.title)} — Episode ${info.ep}"><meta property="og:description" content="${esc(g.ket)}"><meta name="theme-color" content="#000">` +
    `<style>html,body{background:#000;min-height:100%;overscroll-behavior:none}body{touch-action:manipulation}</style></head><body>${html}${hook}</body></html>`
}

function halamanDaftar () {
  const d = db()
  const rows = ARCADE_9.map(g => {
    const s = d.stat[g.id] || { views: 0, plays: 0, likes: 0 }
    return `<a class="c" href="#" onclick="alert('Buka WhatsApp bot ${esc(brand())} lalu ketik ${esc(config.display.prefix + g.cmd)} untuk mendapatkan link main pribadimu');return false"><b>${g.icon} ${esc(g.title)}</b><small>${esc(KATEGORI[g.id] || 'STORY')} · ${g.episode} episode</small><p>${esc(g.ket)}</p><em>👁️ ${s.views} · ▶️ ${s.plays} · ❤️ ${s.likes}</em></a>`
  }).join('')
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(brand())} ARCADE WEB</title><style>body{margin:0;background:#0b0b12;color:#eee;font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:18px}h1{font-size:20px;letter-spacing:2px}.g{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}.c{display:block;background:#15151f;border:1px solid #2a2a3a;border-radius:14px;padding:14px;color:#eee;text-decoration:none}.c b{display:block;font-size:16px}.c small{color:#9aa;display:block;margin:4px 0}.c p{font-size:13px;color:#cbd;margin:6px 0}.c em{font-style:normal;color:#ffd84a;font-size:12px}</style></head><body><h1>🕹️ ${esc(brand())} — ARCADE WEB</h1><p style="color:#9aa">${ARCADE_9.length} game cerita ber-episode. Link main pribadi dikirim lewat chat WhatsApp bot.</p><div class="g">${rows}</div></body></html>`
}

/* ---------------- handler HTTP (dipanggil index.js) ---------------- */
let onTamat = null
/** daftarkan callback saat episode tamat: async ({ info, g, ep, skor }) => {} */
export function setOnTamat (fn) { onTamat = fn }

function baca (req) { return new Promise(res => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e5) req.destroy() }); req.on('end', () => { try { res(JSON.parse(b || '{}')) } catch { res({}) } }) }) }

/** return true kalau request sudah ditangani */
export async function handleWebGame (req, res) {
  const url = String(req.url || '')
  if (!/^\/g(\/|$|\?)/.test(url)) return false
  const parts = url.split('?')[0].split('/').filter(Boolean) // ['g', tok, aksi?]
  const send = (code, type, body) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }); res.end(body) }
  if (parts.length === 1) return send(200, 'text/html; charset=utf-8', halamanDaftar()), true
  const tok = parts[1]; const info = ambilToken(tok)
  if (!info || !BY_ID[info.game]) return send(404, 'text/html; charset=utf-8', `<body style="background:#000;color:#fff;font-family:sans-serif;text-align:center;padding:60px"><h2>Link game tidak ditemukan / kadaluarsa</h2><p>Buka WhatsApp dan ketik perintah game lagi untuk link baru.</p></body>`), true
  const g = BY_ID[info.game]; const s = stat(g.id)
  if (parts.length === 2 && req.method === 'GET') {
    s.views++; if (!info.dibuka) { info.dibuka = true; s.plays++ } saveDB(DBN)
    return send(200, 'text/html; charset=utf-8', halamanGame(tok, info, g)), true
  }
  if (parts[2] === 'like' && req.method === 'POST') {
    s.likedBy = s.likedBy || []; let sudah = true
    if (!s.likedBy.includes(info.user)) { s.likedBy.push(info.user); s.likes++; sudah = false }
    saveDB(DBN); return send(200, 'application/json', JSON.stringify({ ok: true, likes: s.likes, sudah })), true
  }
  if (parts[2] === 'tamat' && req.method === 'POST') {
    const body = await baca(req)
    const ep = Math.max(1, Math.min(g.episode, +body.ep || info.ep))
    if (ep !== info.ep) return send(400, 'application/json', JSON.stringify({ ok: false, pesan: 'episode tidak cocok' })), true
    if (info.selesai) return send(200, 'application/json', JSON.stringify({ ok: true, pesan: '✔ Sudah tercatat', next: info.next || null })), true
    info.selesai = true; saveDB(DBN)
    let r = { next: null, pesan: '✔ Episode tersimpan' }
    try { if (onTamat) r = (await onTamat({ info, g, ep, skor: +body.skor || 0 })) || r } catch (e) { r = { next: null, pesan: '✔ Tersimpan (' + String(e.message).slice(0, 40) + ')' } }
    info.next = r.next; saveDB(DBN)
    return send(200, 'application/json', JSON.stringify({ ok: true, ...r })), true
  }
  return send(404, 'application/json', '{"ok":false}'), true
}

export default { baseUrl, webAktif, buatToken, ambilToken, teksDetail, stat, handleWebGame, setOnTamat, KATEGORI }
