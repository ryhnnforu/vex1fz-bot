/**
 * ============================================================
 *  lib/webdunia.js — DUNIA VOXEL (game web jangka panjang) v7.23.0
 * ------------------------------------------------------------
 *  Game survival/craft voxel 3D (WebGL murni, tanpa CDN) yang
 *  di-host server bot:  GET /w/<token>  → halaman game
 *                       GET /w/<token>/load  → data dunia + progres pemain
 *                       POST /w/<token>/save → simpan dunia (auto tiap 20 dtk & saat keluar)
 *  Fitur: dunia prosedural per pemain (seed), gali/pasang balok,
 *  craft (meja, kapak, pedang, obor, dinding), NPC desa (bicara,
 *  quest berantai 12 quest, barter), monster malam (zombie/ creeper)
 *  + NPC bandit yang bisa diajak duel, siklus siang-malam, lapar,
 *  HP, XP/level, save dunia + inventori + quest ke server bot.
 *  Multi-dunia: tiap pemain bisa punya 3 slot dunia (proyek).
 * ============================================================
 */
import { config } from '../config.js'
import { loadDB, saveDB } from './database.js'

const DBN = 'dunia'
const db = () => loadDB(DBN, { token: {}, dunia: {}, stat: { plays: 0, saves: 0 } })
const brand = () => config.bot?.name || 'THERYHANN!'
const acak = n => { let s = ''; const c = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ'; for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s }

export function buatTokenDunia ({ user, jid, nama, slot = 1 }) {
  const d = db(); const now = Date.now()
  for (const k of Object.keys(d.token)) if (now - (d.token[k].t || 0) > 7 * 86400e3) delete d.token[k]
  const tok = acak(10); d.token[tok] = { user, jid, nama: nama || 'Pemain', slot, t: now }; saveDB(DBN); return tok
}
export function duniaMilik (user) { const d = db(); return d.dunia[user] || {} }
export function hapusDunia (user, slot) { const d = db(); if (d.dunia[user]) { delete d.dunia[user][slot]; saveDB(DBN); return true } return false }
export function ringkasDunia (user) {
  const w = duniaMilik(user); const out = []
  for (const s of [1, 2, 3]) { const x = w[s]; out.push(x ? { slot: s, nama: x.nama || ('Dunia ' + s), level: x.p?.lv || 1, hari: x.hari || 1, quest: x.q?.i || 0, blok: x.ed ? Object.keys(x.ed).length : 0, main: x.menit || 0, t: x.t } : { slot: s, kosong: true }) }
  return out
}

/* ---------------- HTTP ---------------- */
function baca (req) { return new Promise(res => { let b = ''; req.on('data', c => { b += c; if (b.length > 3e6) req.destroy() }); req.on('end', () => { try { res(JSON.parse(b || '{}')) } catch { res({}) } }) }) }
let onQuest = null
export function setOnQuest (fn) { onQuest = fn }

export async function handleDunia (req, res) {
  const url = String(req.url || '')
  if (!/^\/w(\/|$|\?)/.test(url)) return false
  const parts = url.split('?')[0].split('/').filter(Boolean)
  const send = (code, type, body) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body) }
  const d = db(); const tok = parts[1]; const info = tok && d.token[tok]
  if (!info) return send(404, 'text/html; charset=utf-8', '<body style="background:#000;color:#fff;font-family:sans-serif;text-align:center;padding:60px"><h2>Link dunia tidak ditemukan / kadaluarsa</h2><p>Ketik perintah .dunia lagi di WhatsApp untuk link baru.</p></body>'), true
  if (parts.length === 2 && req.method === 'GET') { d.stat.plays++; saveDB(DBN); return send(200, 'text/html; charset=utf-8', halaman(tok, info)), true }
  if (parts[2] === 'load') {
    const w = (d.dunia[info.user] || {})[info.slot] || null
    return send(200, 'application/json', JSON.stringify({ ok: true, nama: info.nama, slot: info.slot, dunia: w, brand: brand() })), true
  }
  if (parts[2] === 'save' && req.method === 'POST') {
    const body = await baca(req)
    if (!body || typeof body !== 'object' || !body.seed) return send(400, 'application/json', '{"ok":false}'), true
    d.dunia[info.user] = d.dunia[info.user] || {}
    const lama = d.dunia[info.user][info.slot] || {}
    const baru = { seed: +body.seed, nama: String(body.nama || lama.nama || 'Dunia ' + info.slot).slice(0, 30), ed: body.ed || {}, p: body.p || {}, inv: body.inv || {}, q: body.q || {}, hari: +body.hari || 1, waktu: +body.waktu || 0, npc: body.npc || {}, menit: (+lama.menit || 0) + (+body.dMenit || 0), t: Date.now(), tamat: !!body.tamat }
    if (JSON.stringify(baru).length > 900000) return send(413, 'application/json', '{"ok":false,"pesan":"dunia terlalu besar"}'), true
    d.dunia[info.user][info.slot] = baru; d.stat.saves++; saveDB(DBN)
    // notifikasi quest selesai ke chat (opsional)
    if (body.questBaru && onQuest) { try { await onQuest({ info, quest: body.questBaru, p: baru.p }) } catch {} }
    return send(200, 'application/json', JSON.stringify({ ok: true, t: baru.t })), true
  }
  return send(404, 'application/json', '{"ok":false}'), true
}

/* ---------------- HALAMAN GAME ---------------- */
function halaman (tok, info) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><title>Dunia Voxel — ${brand()}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{width:100%;height:100%;overflow:hidden;background:#000;font-family:-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff;touch-action:none}
#cv{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
#hud{position:absolute;left:0;top:0;right:0;padding:8px 10px;pointer-events:none;display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.bar{background:rgba(0,0,0,.45);border-radius:10px;padding:6px 9px;font-size:11px;line-height:1.35;backdrop-filter:blur(4px)}
.bar b{font-size:12px}
.meter{height:6px;border-radius:4px;background:rgba(255,255,255,.2);margin-top:3px;width:120px;overflow:hidden}.meter i{display:block;height:100%;border-radius:4px}
#quest{max-width:52%}
#hot{position:absolute;left:50%;top:64px;transform:translateX(-50%);display:flex;gap:5px;pointer-events:auto}
#hot div{width:44px;height:44px;border-radius:9px;background:rgba(0,0,0,.5);border:2px solid rgba(255,255,255,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;text-align:center;line-height:1}
#hot div.on{border-color:#ffd84a;background:rgba(255,216,74,.2)}#hot div s{font-size:16px;text-decoration:none;margin-bottom:2px}#hot div em{font-style:normal;color:#ffd84a}
#joy{position:absolute;left:18px;bottom:22px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.25);pointer-events:auto}
#knob{position:absolute;left:38px;top:38px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.5)}
.btn{position:absolute;pointer-events:auto;border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;text-align:center;line-height:1.05}
#bJump{right:18px;bottom:26px;width:64px;height:64px}#bAct{right:96px;bottom:22px;width:72px;height:72px;background:rgba(255,120,60,.3);border-color:#ff9a5c}#bPlace{right:24px;bottom:104px;width:58px;height:58px;background:rgba(80,200,120,.25);border-color:#5ce09a}
#bInv{right:12px;top:78px;width:46px;height:46px;font-size:18px}#bMenu{right:12px;top:130px;width:46px;height:46px;font-size:18px}#bTalk{right:100px;bottom:104px;width:58px;height:58px;background:rgba(90,150,255,.25);border-color:#7fb0ff;display:none}
#cross{position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px;border:2px solid rgba(255,255,255,.8);border-radius:50%;pointer-events:none}
#pan{position:absolute;left:0;top:0;right:0;bottom:0;display:none;background:rgba(6,8,12,.86);padding:16px;overflow:auto;pointer-events:auto}
#pan.on{display:block}
.card{background:#151a22;border:1px solid #2b3442;border-radius:14px;padding:14px;margin-bottom:12px}
.card h3{font-size:14px;color:#ffd84a;letter-spacing:1px;margin-bottom:8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px}
.it{background:#0e131a;border:1px solid #2b3442;border-radius:10px;padding:8px;text-align:center;font-size:11px}.it s{display:block;font-size:22px;text-decoration:none}.it b{color:#ffd84a}
.it.ok{border-color:#5ce09a}.it.no{opacity:.45}
.b{display:inline-block;background:#ffd84a;color:#111;font-weight:800;border-radius:10px;padding:10px 14px;margin:4px 4px 0 0;font-size:13px}.b.sec{background:#2b3442;color:#fff}.b.red{background:#e0524f;color:#fff}
#dlg{position:absolute;left:12px;right:12px;bottom:200px;background:rgba(10,12,18,.94);border:1px solid #3a4658;border-radius:14px;padding:14px;display:none;pointer-events:auto}
#dlg.on{display:block}#dlg h4{color:#7fb0ff;font-size:13px;margin-bottom:6px}#dlg p{font-size:13px;line-height:1.45}#dlg .o{margin-top:8px}#dlg .o div{background:#1d2532;border:1px solid #3a4658;border-radius:9px;padding:9px 11px;margin-top:6px;font-size:13px}
#toast{position:absolute;left:50%;top:70px;transform:translateX(-50%);background:rgba(0,0,0,.7);border-radius:10px;padding:8px 14px;font-size:12px;opacity:0;transition:.3s;pointer-events:none;max-width:90%;text-align:center}
#splash{position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,#2a4a6a,#06080c 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;pointer-events:auto}
#splash h1{font-size:34px;letter-spacing:4px;text-shadow:0 4px 20px #000}#splash p{color:#aab;max-width:360px;font-size:13px;line-height:1.5;margin:10px 0 18px}
.dmg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle,transparent 50%,rgba(255,0,0,.55));opacity:0;transition:.15s}
</style></head><body>
<canvas id="cv"></canvas><div class="dmg" id="dmg"></div><div id="cross"></div>
<div id="hud"><div class="bar" id="stat"></div><div class="bar" id="quest"></div></div>
<div id="toast"></div>
<div id="hot"></div>
<div id="joy"><div id="knob"></div></div>
<div class="btn" id="bJump">LOMPAT</div><div class="btn" id="bAct">GALI /<br>SERANG</div><div class="btn" id="bPlace">PASANG</div><div class="btn" id="bTalk">BICARA</div>
<div class="btn" id="bInv">🎒</div><div class="btn" id="bMenu">☰</div>
<div id="dlg"></div>
<div id="pan"></div>
<div id="splash"><h1>DUNIA VOXEL</h1><p id="spInfo">Memuat dunia…</p><div class="b" id="spGo" style="display:none">▶ MASUK DUNIA</div><p style="font-size:11px;color:#667">${brand()} · geser layar kanan untuk melihat · joystick kiri untuk jalan<br>Dunia tersimpan otomatis ke bot tiap 20 detik.</p></div>
<script>
var TOK=${JSON.stringify(tok)},BRAND=${JSON.stringify(brand())};
${JS_GAME}
</script></body></html>`
}

/* ============================ GAME JS ============================ */
const JS_GAME = String.raw`
/* ---------- util ---------- */
var I=function(id){return document.getElementById(id)};
function toast(t){var e=I('toast');e.textContent=t;e.style.opacity=1;clearTimeout(e._t);e._t=setTimeout(function(){e.style.opacity=0},1800)}
var AC=null;function bip(f,d,w,v){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var o=AC.createOscillator(),g=AC.createGain();o.type=w||'square';o.frequency.value=f;g.gain.value=v||.04;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+(d||.1));o.stop(AC.currentTime+(d||.1))}catch(e){}}
function rnd(seed){var s=seed>>>0;return function(){s=(s+0x6D2B79F5)|0;var t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
function hash2(x,z,seed){var h=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^Math.imul(seed|0,1274126177);h=Math.imul(h^(h>>>13),1103515245);return((h^(h>>>16))>>>0)/4294967296}
function lerp(a,b,t){return a+(b-a)*t}function smooth(t){return t*t*(3-2*t)}
function noise2(x,z,seed){var x0=Math.floor(x),z0=Math.floor(z),fx=x-x0,fz=z-z0;var a=hash2(x0,z0,seed),b=hash2(x0+1,z0,seed),c=hash2(x0,z0+1,seed),d=hash2(x0+1,z0+1,seed);return lerp(lerp(a,b,smooth(fx)),lerp(c,d,smooth(fx)),smooth(fz))}
function fbm(x,z,seed){return noise2(x/28,z/28,seed)*.6+noise2(x/9,z/9,seed+7)*.3+noise2(x/3,z/3,seed+13)*.1}

/* ---------- blok ---------- */
var B={UDARA:0,RUMPUT:1,TANAH:2,BATU:3,KAYU:4,DAUN:5,AIR:6,PASIR:7,PAPAN:8,BATUBATA:9,OBOR:10,MEJA:11,BIJIH:12,KACA:13,BUNGA:14,KUBURAN:15};
var BLOK={1:{n:'Rumput',c:[[.36,.62,.27],[.42,.30,.18],[.40,.30,.18]],drop:'tanah',hp:2},2:{n:'Tanah',c:[[.42,.30,.18]],drop:'tanah',hp:2},3:{n:'Batu',c:[[.50,.50,.52]],drop:'batu',hp:5,alat:'beliung'},4:{n:'Kayu',c:[[.45,.33,.18],[.55,.42,.24]],drop:'kayu',hp:4},5:{n:'Daun',c:[[.22,.50,.20]],drop:'apel',hp:1,chance:.15},6:{n:'Air',c:[[.20,.45,.85]],hp:99,cair:true},7:{n:'Pasir',c:[[.85,.78,.55]],drop:'pasir',hp:2},8:{n:'Papan',c:[[.68,.52,.30]],drop:'papan',hp:3},9:{n:'Bata',c:[[.62,.30,.25]],drop:'bata',hp:6},10:{n:'Obor',c:[[1,.8,.3]],drop:'obor',hp:1,kecil:true,cahaya:true},11:{n:'Meja Kerja',c:[[.55,.40,.22],[.75,.55,.3]],drop:'meja',hp:3},12:{n:'Bijih Besi',c:[[.55,.50,.45],[.8,.6,.4]],drop:'besi',hp:8,alat:'beliung'},13:{n:'Kaca',c:[[.75,.9,1]],drop:'kaca',hp:1},14:{n:'Bunga',c:[[.95,.4,.6]],drop:'bunga',hp:1,kecil:true},15:{n:'Nisan',c:[[.35,.35,.4]],hp:99}};
var ITEM={tanah:['🟫','Tanah',B.TANAH],batu:['🪨','Batu',B.BATU],kayu:['🪵','Kayu',B.KAYU],papan:['🟧','Papan',B.PAPAN],pasir:['🟨','Pasir',B.PASIR],bata:['🧱','Bata',B.BATUBATA],obor:['🕯️','Obor',B.OBOR],meja:['🛠️','Meja Kerja',B.MEJA],kaca:['🔷','Kaca',B.KACA],bunga:['🌸','Bunga',B.BUNGA],apel:['🍎','Apel'],besi:['⛓️','Besi'],tongkat:['🥢','Tongkat'],kapak:['🪓','Kapak'],beliung:['⛏️','Beliung'],pedang:['🗡️','Pedang Kayu'],pedangbesi:['⚔️','Pedang Besi'],roti:['🍞','Roti'],daging:['🍖','Daging'],koin:['🪙','Koin'],ramuan:['🧪','Ramuan'],peta:['🗺️','Peta Harta'],kunci:['🗝️','Kunci Tua'],permata:['💎','Permata']};
var RESEP=[
 {id:'papan',n:'4 Papan',b:{kayu:1},h:{papan:4}},{id:'tongkat',n:'4 Tongkat',b:{papan:2},h:{tongkat:4}},{id:'meja',n:'Meja Kerja',b:{papan:4},h:{meja:1}},
 {id:'obor',n:'4 Obor',b:{tongkat:1,batu:1},h:{obor:4}},{id:'kapak',n:'Kapak',b:{papan:3,tongkat:2},h:{kapak:1},meja:true},{id:'beliung',n:'Beliung',b:{papan:3,tongkat:2},h:{beliung:1},meja:true},
 {id:'pedang',n:'Pedang Kayu',b:{papan:2,tongkat:1},h:{pedang:1},meja:true},{id:'pedangbesi',n:'Pedang Besi',b:{besi:2,tongkat:1},h:{pedangbesi:1},meja:true},
 {id:'bata',n:'4 Bata',b:{tanah:2,batu:2},h:{bata:4},meja:true},{id:'kaca',n:'2 Kaca',b:{pasir:2,obor:1},h:{kaca:2},meja:true},{id:'roti',n:'Roti',b:{apel:2},h:{roti:1}},{id:'ramuan',n:'Ramuan',b:{bunga:3,apel:1},h:{ramuan:1},meja:true}
];
var ALATDMG={pedangbesi:6,pedang:3,kapak:2,beliung:2};

/* ---------- state ---------- */
var SEED=0,ED={},NPCS=[],MOBS=[],P={x:0,y:20,z:0,vx:0,vy:0,vz:0,yaw:0,pitch:-.2,hp:20,lapar:20,xp:0,lv:1,mati:0,ground:false},INV={},HOT=['kayu','tanah','batu','obor','papan','pedang','roti','apel'],SEL=0,HARI=1,WAKTU=0.3,Q={i:0,n:{}},NAMA='Dunia',menitAwal=Date.now(),lastSave=0,questBaruKirim=null,dirty=false;
var NPC_DEF=[
 {id:'kepala',n:'Pak Lurah Jaya',c:[.9,.7,.5],b:[.2,.3,.6],rumah:true,quest:true},
 {id:'pandai',n:'Bu Sari (Pandai Besi)',c:[.8,.6,.45],b:[.5,.2,.2],toko:{pedangbesi:{koin:12},beliung:{koin:6},kapak:{koin:5}},jual:{besi:2,batu:1}},
 {id:'petani',n:'Mas Dodi (Petani)',c:[.85,.65,.5],b:[.3,.6,.3],toko:{roti:{koin:2},apel:{koin:1},bunga:{koin:1}},jual:{apel:1,kayu:1,tanah:1}},
 {id:'dukun',n:'Mbah Wiro (Dukun)',c:[.7,.6,.5],b:[.35,.2,.45],toko:{ramuan:{koin:5},peta:{koin:15}},jual:{bunga:2,permata:30}},
 {id:'anak',n:'Nina (anak desa)',c:[.9,.75,.6],b:[.9,.5,.7],ngobrol:['Kak, aku lihat bandit di bukit timur… serem.','Malam-malam jangan keluar ya kak, zombie!','Kata Mbah Wiro ada harta di bawah pohon tertinggi.','Kakak udah punya rumah? Aku mau lihat!']},
 {id:'bandit',n:'Bandit Codet',c:[.7,.55,.4],b:[.15,.15,.15],musuh:true,hp:30,dmg:3,drop:{koin:6,kunci:1},jauh:true},
 {id:'bandit2',n:'Bandit Kumis',c:[.7,.55,.4],b:[.2,.15,.1],musuh:true,hp:22,dmg:2,drop:{koin:4},jauh:true},
 {id:'raja',n:'Raja Bandit Garong',c:[.6,.5,.4],b:[.4,.05,.05],musuh:true,hp:80,dmg:5,drop:{koin:30,permata:1},jauh:true,bos:true}
];
var QUEST=[
 {t:'Kenalan dengan Pak Lurah',d:'Cari desa (bendera merah di HUD) & bicara dengan Pak Lurah Jaya.',c:function(){return Q.n.lurah},r:{koin:3}},
 {t:'Kumpulkan 10 kayu',d:'Pukul pohon dengan tangan/kapak (tombol GALI).',c:function(){return (INV.kayu||0)>=10},r:{koin:4,apel:3}},
 {t:'Buat Meja Kerja',d:'Buka 🎒 → Craft: 4 papan → meja. Lalu pasang di tanah.',c:function(){return Q.n.mejaPasang},r:{koin:5}},
 {t:'Buat Beliung & tambang 8 batu',d:'Craft beliung di dekat meja. Gali batu abu-abu.',c:function(){return (INV.beliung||0)>=1&&(INV.batu||0)>=8},r:{koin:6,obor:4}},
 {t:'Bangun rumah (pasang 30 balok)',d:'Buat tempat berlindung sebelum malam. Pasang papan/bata/tanah.',c:function(){return (Q.n.pasang||0)>=30},r:{koin:8,roti:3}},
 {t:'Bertahan 1 malam',d:'Zombie muncul saat gelap. Sembunyi atau lawan dengan pedang.',c:function(){return HARI>=2},r:{koin:6,pedang:1}},
 {t:'Bantu Mas Dodi: 6 apel',d:'Hancurkan daun pohon; kadang jatuh apel. Serahkan ke Mas Dodi.',c:function(){return Q.n.apelSerah},r:{koin:8}},
 {t:'Tambang 3 bijih besi',d:'Bijih besi (batu bertitik oranye) ada di lereng & gua. Butuh beliung.',c:function(){return (INV.besi||0)>=3||Q.n.besi},r:{koin:10}},
 {t:'Tempa Pedang Besi',d:'Craft pedang besi (2 besi + tongkat) di dekat meja, atau beli dari Bu Sari.',c:function(){return (INV.pedangbesi||0)>=1},r:{koin:6,ramuan:1}},
 {t:'Kalahkan Bandit Codet',d:'Ada di bukit timur desa (penanda ⚔️). Dia menyimpan Kunci Tua.',c:function(){return Q.n.banditMati},r:{koin:12}},
 {t:'Temukan Harta Karun',d:'Beli/dapat Peta Harta dari Mbah Wiro. Gali di lokasi tanda X (penanda 🗺️) pakai Kunci Tua.',c:function(){return Q.n.harta},r:{koin:20,permata:1}},
 {t:'Kalahkan Raja Bandit',d:'Bos di menara utara. HP 80, bawa ramuan & pedang besi!',c:function(){return Q.n.rajaMati},r:{koin:50,permata:3}}
];

/* ---------- dunia ---------- */
function tinggi(x,z){var h=fbm(x,z,SEED);var d=Math.hypot(x-DESA.x,z-DESA.z);var t=8+Math.floor(h*14);if(d<14)t=DESA.y;else if(d<20)t=Math.round(lerp(DESA.y,t,(d-14)/6));return t}
var DESA={x:0,z:0,y:12},BUKIT={x:34,z:6},MENARA={x:-6,z:-40},HARTA={x:0,z:0};
function pohonDi(x,z){return hash2(x,z,SEED+99)>.975&&Math.hypot(x-DESA.x,z-DESA.z)>15&&tinggi(x,z)>9}
function blokAsli(x,y,z){
 var k=x+','+y+','+z;if(ED[k]!==undefined)return ED[k];
 var t=tinggi(x,z);
 if(y>t){ // di atas permukaan: pohon? air? struktur desa
  if(y<=9&&t<9)return B.AIR;
  // pohon
  for(var dx=-2;dx<=2;dx++)for(var dz=-2;dz<=2;dz++){var px=x+dx,pz=z+dz;if(pohonDi(px,pz)){var pt=tinggi(px,pz);if(dx===0&&dz===0&&y<=pt+4)return B.KAYU;if(y>=pt+3&&y<=pt+6&&Math.abs(dx)+Math.abs(dz)+Math.abs(y-(pt+5))<=3)return B.DAUN}}
  var s=struktur(x,y,z);if(s)return s;
  if(y===t+1&&hash2(x,z,SEED+5)>.993&&t>9)return B.BUNGA;
  return B.UDARA}
 if(y===t)return t<=9?B.PASIR:B.RUMPUT;
 if(y>t-3)return B.TANAH;
 if(hash2(x*7+y,z*3+y,SEED+3)>.965&&y<t-3)return B.BIJIH;
 return B.BATU}
function struktur(x,y,z){
 // rumah-rumah desa (4 rumah + sumur) + menara bandit
 var R=[[-8,-8],[6,-8],[-8,6],[6,6]];
 for(var i=0;i<R.length;i++){var rx=R[i][0],rz=R[i][1],lx=x-rx,lz=z-rz,ly=y-DESA.y;if(lx>=0&&lx<=4&&lz>=0&&lz<=4&&ly>=1&&ly<=4){if(ly===4)return B.PAPAN;if(lx===0||lx===4||lz===0||lz===4){if(lz===0&&lx===2&&ly<=2)return B.UDARA;if(ly===2&&(lx===2||lz===2))return B.KACA;return i%2?B.BATUBATA:B.PAPAN}if(ly===1&&lx===1&&lz===1&&i===1)return B.MEJA;return B.UDARA}}
 if(Math.abs(x-MENARA.x)<=2&&Math.abs(z-MENARA.z)<=2){var ty=tinggi(MENARA.x,MENARA.z);var ly2=y-ty;if(ly2>=1&&ly2<=9){if(Math.abs(x-MENARA.x)===2||Math.abs(z-MENARA.z)===2){if(z-MENARA.z===2&&x===MENARA.x&&ly2<=2)return B.UDARA;return ly2===9?B.OBOR:B.BATU}return B.UDARA}}
 if(y===DESA.y+1&&Math.abs(x)<=1&&Math.abs(z)<=1&&(Math.abs(x)===1||Math.abs(z)===1))return B.BATU; // sumur
 return 0}
function blok(x,y,z){if(y<0)return B.BATU;if(y>40)return 0;return blokAsli(x,y,z)}
function setBlok(x,y,z,v){ED[x+','+y+','+z]=v;dirty=true;bangunSekitar(x,z)}
function padat(v){return v&&!BLOK[v].cair&&!BLOK[v].kecil}

/* ---------- render: WebGL sederhana, chunk mesh 8x8 ---------- */
var cv=I('cv'),gl=cv.getContext('webgl',{antialias:true,powerPreference:'high-performance'});
var VS='attribute vec3 p;attribute vec3 c;attribute float l;uniform mat4 M;varying vec3 vc;varying float vl;varying float fd;void main(){gl_Position=M*vec4(p,1.);vc=c;vl=l;fd=gl_Position.w;}';
var FS='precision mediump float;varying vec3 vc;varying float vl;varying float fd;uniform vec3 fog;uniform float amb;uniform float fogD;void main(){vec3 col=vc*vl*amb;col=pow(col,vec3(.9));float f=clamp((fd-fogD*.6)/(fogD*.4),0.,1.);f=f*f;gl_FragColor=vec4(mix(col,fog,f),1.);}';
function sh(t,s){var x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x}
var PR=gl.createProgram();gl.attachShader(PR,sh(gl.VERTEX_SHADER,VS));gl.attachShader(PR,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(PR);gl.useProgram(PR);
var aP=gl.getAttribLocation(PR,'p'),aC=gl.getAttribLocation(PR,'c'),aL=gl.getAttribLocation(PR,'l'),uM=gl.getUniformLocation(PR,'M'),uF=gl.getUniformLocation(PR,'fog'),uA=gl.getUniformLocation(PR,'amb'),uD=gl.getUniformLocation(PR,'fogD');
gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
var CH=8,CHUNKS={},VIEW=(navigator.hardwareConcurrency||4)>=6?8:6;/* v7.28.0: jarak pandang lebih jauh, AA aktif, DPR 2.5 */
function keyC(cx,cz){return cx+','+cz}
function bangunSekitar(x,z){var cx=Math.floor(x/CH),cz=Math.floor(z/CH);for(var dx=-1;dx<=1;dx++)for(var dz=-1;dz<=1;dz++){var k=keyC(cx+dx,cz+dz);if(CHUNKS[k])CHUNKS[k].dirty=true}}
var FACES=[[[1,0,0],[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],.8],[[-1,0,0],[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],.8],[[0,1,0],[[0,1,0],[0,1,1],[1,1,1],[1,1,0]],1],[[0,-1,0],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],.5],[[0,0,1],[[1,0,1],[1,1,1],[0,1,1],[0,0,1]],.65],[[0,0,-1],[[0,0,0],[0,1,0],[1,1,0],[1,0,0]],.65]];
function mesh(cx,cz){var v=[],n=0;var x0=cx*CH,z0=cz*CH;
 for(var x=x0;x<x0+CH;x++)for(var z=z0;z<z0+CH;z++){var top=tinggi(x,z)+8;for(var y=Math.max(0,tinggi(x,z)-6);y<=Math.min(40,top);y++){var b=blok(x,y,z);if(!b)continue;var def=BLOK[b];var sc=def.kecil?.3:1,off=def.kecil?.35:0;var hk=def.kecil?(b===B.OBOR?.6:.35):1;
  for(var f=0;f<6;f++){var F=FACES[f],nn=F[0];var nb=def.kecil?0:blok(x+nn[0],y+nn[1],z+nn[2]);if(nb&&padat(nb)&&!(BLOK[nb].cair)&&nb!==B.KACA&&nb!==B.DAUN)continue;if(nb===b&&(b===B.AIR||b===B.KACA||b===B.DAUN))continue;
   var col=def.c[f===2&&def.c.length>1?0:(def.c.length>2?2:def.c.length-1)];if(def.c.length===2)col=def.c[f===2?1:0];if(b===B.RUMPUT)col=f===2?def.c[0]:(f===3?def.c[1]:def.c[2]);
   var l=F[2]*(0.85+0.15*hash2(x*3+y,z*5+f,SEED));var q=F[1];var idx=[0,1,2,0,2,3];
   for(var i=0;i<6;i++){var pnt=q[idx[i]];v.push(x+off+pnt[0]*sc,y+pnt[1]*hk,z+off+pnt[2]*sc,col[0],col[1],col[2],l);n++}}}}
 var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);return {buf:buf,n:n}}
function chunk(cx,cz){var k=keyC(cx,cz),c=CHUNKS[k];if(!c||c.dirty){if(c&&c.buf)gl.deleteBuffer(c.buf);var mm=mesh(cx,cz);CHUNKS[k]={buf:mm.buf,n:mm.n,dirty:false,t:Date.now()}}return CHUNKS[k]}
// entitas (NPC/mob) digambar sebagai kotak berwarna dinamis
var dynBuf=gl.createBuffer();
function kotak(v,x,y,z,sx,sy,sz,col,l){for(var f=0;f<6;f++){var F=FACES[f],q=F[1],idx=[0,1,2,0,2,3];for(var i=0;i<6;i++){var p=q[idx[i]];v.push(x-sx/2+p[0]*sx,y+p[1]*sy,z-sz/2+p[2]*sz,col[0],col[1],col[2],F[2]*(l||1))}}}
function gambarEnt(){var v=[];var all=NPCS.concat(MOBS);for(var i=0;i<all.length;i++){var e=all[i];if(e.mati)continue;var d=Math.hypot(e.x-P.x,e.z-P.z);if(d>40)continue;var fl=e.flash>0?[1,.3,.3]:null;
 kotak(v,e.x,e.y,e.z,.5,.75,.3,fl||e.b,1);kotak(v,e.x,e.y+.75,e.z,.42,.42,.42,fl||e.c,1);
 if(e.zombie)kotak(v,e.x,e.y+.5,e.z+.28,.5,.12,.3,[.2,.4,.2],1);
 if(e.creeper){kotak(v,e.x,e.y+.9,e.z+.22,.3,.12,.05,[0,0,0],1)}
 if(e.hp!==undefined&&e.hpMax){var r=Math.max(0,e.hp/e.hpMax);kotak(v,e.x-(1-r)*.35,e.y+1.35,e.z,.7*r,.06,.06,[1-r,r,0],1)}}
 if(!v.length)return;gl.bindBuffer(gl.ARRAY_BUFFER,dynBuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.DYNAMIC_DRAW);attr();gl.drawArrays(gl.TRIANGLES,0,v.length/7)}
function attr(){gl.vertexAttribPointer(aP,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(aP);gl.vertexAttribPointer(aC,3,gl.FLOAT,false,28,12);gl.enableVertexAttribArray(aC);gl.vertexAttribPointer(aL,1,gl.FLOAT,false,28,24);gl.enableVertexAttribArray(aL)}
function mat(){var W=cv.width,H=cv.height,f=1/Math.tan(.55),a=W/H,n=.1,fa=90;var pr=[f/a,0,0,0,0,f,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0];
 var cy=Math.cos(P.yaw),sy=Math.sin(P.yaw),cp=Math.cos(P.pitch),sp=Math.sin(P.pitch);var ex=P.x,ey=P.y+1.6,ez=P.z;
 // view = Rx(-pitch)*Ry(-yaw)*T(-eye)
 var ry=[cy,0,-sy,0, 0,1,0,0, sy,0,cy,0, 0,0,0,1];var rx=[1,0,0,0, 0,cp,sp,0, 0,-sp,cp,0, 0,0,0,1];
 var t=[1,0,0,0,0,1,0,0,0,0,1,0,-ex,-ey,-ez,1];return mul(pr,mul(rx,mul(ry,t)))}
function mul(a,b){var o=new Array(16);for(var i=0;i<4;i++)for(var j=0;j<4;j++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o}
function render(){var W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio||1,2.5);if(cv.width!==W*dpr|0||cv.height!==H*dpr|0){cv.width=W*dpr|0;cv.height=H*dpr|0}gl.viewport(0,0,cv.width,cv.height);
 var sun=Math.max(0,Math.sin(WAKTU*Math.PI*2));var amb=.25+.75*sun;var sky=[lerp(.02,.55,amb),lerp(.03,.75,amb),lerp(.08,.95,amb)];
 gl.clearColor(sky[0],sky[1],sky[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(uM,false,new Float32Array(mat()));gl.uniform3fv(uF,sky);gl.uniform1f(uA,amb);gl.uniform1f(uD,VIEW*CH);
 var pcx=Math.floor(P.x/CH),pcz=Math.floor(P.z/CH);var cnt=0;
 for(var dx=-VIEW;dx<=VIEW;dx++)for(var dz=-VIEW;dz<=VIEW;dz++){if(dx*dx+dz*dz>VIEW*VIEW+2)continue;var c=chunk(pcx+dx,pcz+dz);if(!c.n)continue;gl.bindBuffer(gl.ARRAY_BUFFER,c.buf);attr();gl.drawArrays(gl.TRIANGLES,0,c.n);cnt++}
 gambarEnt();
 // buang chunk jauh
 for(var k in CHUNKS){var p=k.split(',');if(Math.abs(p[0]-pcx)>VIEW+3||Math.abs(p[1]-pcz)>VIEW+3){gl.deleteBuffer(CHUNKS[k].buf);delete CHUNKS[k]}}}

/* ---------- raycast target ---------- */
function arah(){return [Math.sin(P.yaw)*Math.cos(P.pitch)*-1,Math.sin(P.pitch),Math.cos(P.pitch)*Math.cos(P.yaw)*-1]}
function target(){var d=arah(),ox=P.x,oy=P.y+1.6,oz=P.z,last=null;for(var t=0;t<5;t+=.05){var x=Math.floor(ox+d[0]*t),y=Math.floor(oy+d[1]*t),z=Math.floor(oz+d[2]*t);var b=blok(x,y,z);if(b&&b!==B.AIR)return {x:x,y:y,z:z,b:b,prev:last};last=[x,y,z]}return null}
function entDepan(jarak){var d=arah();var best=null,bd=jarak||3.2;var all=NPCS.concat(MOBS);for(var i=0;i<all.length;i++){var e=all[i];if(e.mati)continue;var dx=e.x-P.x,dz=e.z-P.z,dy=(e.y+.8)-(P.y+1.6);var dist=Math.hypot(dx,dz,dy);if(dist>bd)continue;var dot=(dx*d[0]+dz*d[2]+dy*d[1])/dist;if(dot>.75){best=e;bd=dist}}return best}

/* ---------- fisika pemain ---------- */
function solidAt(x,y,z){var b=blok(Math.floor(x),Math.floor(y),Math.floor(z));return padat(b)}
function collide(nx,ny,nz){var r=.3;for(var dx=-r;dx<=r;dx+=2*r)for(var dz=-r;dz<=r;dz+=2*r)for(var dy=0;dy<=1.7;dy+=.85)if(solidAt(nx+dx,ny+dy,nz+dz))return true;return false}
var joy={x:0,y:0},jump=false;
function fisika(dt){var sp=P.lapar<=0?2.2:4.2;var fw=-joy.y*sp,st=joy.x*sp;var vx=Math.sin(P.yaw)*-fw+Math.cos(P.yaw)*st,vz=Math.cos(P.yaw)*-fw-Math.sin(P.yaw)*st;
 P.vy-=22*dt;if(jump&&P.ground){P.vy=7.6;P.ground=false;jump=false}
 var inAir=blok(Math.floor(P.x),Math.floor(P.y+.5),Math.floor(P.z))===B.AIR;if(inAir){P.vy=Math.max(P.vy,-1.5);if(jump){P.vy=3;jump=false}}
 var nx=P.x+vx*dt;if(!collide(nx,P.y,P.z))P.x=nx;else if(!collide(nx,P.y+1.01,P.z)&&P.ground){P.y+=1.01;P.x=nx}
 var nz=P.z+vz*dt;if(!collide(P.x,P.y,nz))P.z=nz;else if(!collide(P.x,P.y+1.01,nz)&&P.ground){P.y+=1.01;P.z=nz}
 var ny=P.y+P.vy*dt;if(collide(P.x,ny,P.z)){if(P.vy<0){if(P.vy<-14)luka(Math.floor((-P.vy-14)/2),'jatuh');P.ground=true}P.vy=0}else{P.y=ny;P.ground=false}
 if(P.y<-5){P.y=tinggi(Math.floor(P.x),Math.floor(P.z))+2;luka(5,'jurang')}}

/* ---------- inventori/craft ---------- */
function tambah(id,n){INV[id]=(INV[id]||0)+(n||1);if(INV[id]<=0)delete INV[id];dirty=true;hot()}
function punya(b){for(var k in b)if((INV[k]||0)<b[k])return false;return true}
function craft(r){if(r.meja&&!mejaDekat())return toast('butuh Meja Kerja di dekatmu (radius 4)');if(!punya(r.b))return toast('bahan kurang');for(var k in r.b)tambah(k,-r.b[k]);for(var h in r.h)tambah(h,r.h[h]);bip(660,.1);toast('✔ '+r.n);dirty=true;buka('inv')}
function mejaDekat(){for(var dx=-4;dx<=4;dx++)for(var dy=-2;dy<=2;dy++)for(var dz=-4;dz<=4;dz++)if(blok(Math.floor(P.x)+dx,Math.floor(P.y)+dy,Math.floor(P.z)+dz)===B.MEJA)return true;return false}
function hot(){var h=I('hot');h.innerHTML='';HOT.forEach(function(id,i){var it=ITEM[id];var d=document.createElement('div');d.className=i===SEL?'on':'';d.innerHTML='<s>'+(it?it[0]:'·')+'</s>'+(it?it[1].split(' ')[0]:'')+'<em>'+(INV[id]||'')+'</em>';d.onclick=function(){SEL=i;hot();var it2=ITEM[HOT[SEL]];toast((INV[HOT[SEL]]?'':'(kosong) ')+(it2?it2[1]:''))};h.appendChild(d)})}
function makan(id){var v={apel:3,roti:6,daging:7}[id];if(!v)return;if(!INV[id])return toast('tidak punya');tambah(id,-1);P.lapar=Math.min(20,P.lapar+v);P.hp=Math.min(20,P.hp+1);bip(500,.08,'sine');toast('🍽️ +'+v+' kenyang')}
function minum(){if(!INV.ramuan)return toast('tidak punya ramuan');tambah('ramuan',-1);P.hp=20;toast('🧪 HP penuh!');bip(900,.15,'sine')}

/* ---------- aksi ---------- */
var galiT=null,galiHP=0;
function aksi(){if(dlgOpen)return;var e=entDepan();if(e){serang(e);return}var t=target();if(!t)return;var def=BLOK[t.b];if(def.hp>=99)return toast('tidak bisa dihancurkan');
 var alat=HOT[SEL];var kuat=(def.alat&&INV[def.alat]?3:1)*(alat==='kapak'&&INV.kapak&&(t.b===B.KAYU||t.b===B.DAUN||t.b===B.PAPAN)?3:1);
 if(def.alat&&!INV[def.alat])return toast('butuh '+ITEM[def.alat][1]+' untuk menggali '+def.n);
 var key=t.x+','+t.y+','+t.z;if(galiT!==key){galiT=key;galiHP=def.hp}galiHP-=kuat;bip(200+Math.random()*80,.05,'square',.03);if(galiHP>0)return;
 setBlok(t.x,t.y,t.z,B.UDARA);galiT=null;
 if(def.drop&&(!def.chance||Math.random()<def.chance)){tambah(def.drop,1);toast('+1 '+ITEM[def.drop][1])}
 if(t.b===B.KAYU)Q.n.kayu=(Q.n.kayu||0)+1;if(t.b===B.BIJIH)Q.n.besi=true;
 // harta karun
 if(INV.peta&&Math.abs(t.x-HARTA.x)<=1&&Math.abs(t.z-HARTA.z)<=1&&t.y<=tinggi(HARTA.x,HARTA.z)-1&&!Q.n.harta){if(!INV.kunci)return toast('🗝️ Peti terkunci! Butuh Kunci Tua dari Bandit Codet.');Q.n.harta=true;tambah('koin',25);tambah('permata',2);tambah('daging',5);toast('💰 HARTA KARUN! +25 koin +2 permata');bip(880,.3,'sine')}
 P.lapar=Math.max(0,P.lapar-.03);cekQuest()}
function pasang(){if(dlgOpen)return;var id=HOT[SEL],it=ITEM[id];if(!it||!it[2])return toast('item ini tidak bisa dipasang');if(!INV[id])return toast('tidak punya '+it[1]);var t=target();if(!t||!t.prev)return;var p=t.prev;
 if(Math.floor(P.x)===p[0]&&Math.floor(P.z)===p[2]&&(p[1]===Math.floor(P.y)||p[1]===Math.floor(P.y)+1))return toast('kamu berdiri di situ');
 setBlok(p[0],p[1],p[2],it[2]);tambah(id,-1);bip(320,.06,'square',.03);Q.n.pasang=(Q.n.pasang||0)+1;if(it[2]===B.MEJA)Q.n.mejaPasang=true;cekQuest()}
function serang(e){var alat=HOT[SEL];var dmg=ALATDMG[alat]&&INV[alat]?ALATDMG[alat]:1;if(!e.musuh&&!e.zombie&&!e.creeper){if(e.def&&e.def.quest)return bicara(e);return toast(e.n+': "Eh! Jangan pukul aku!"')}
 e.hp-=dmg;e.flash=.15;e.agro=true;var kb=.9;var dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz)||1;e.x+=dx/d*kb;e.z+=dz/d*kb;bip(150,.08,'sawtooth',.05);getar(30);
 if(e.hp<=0){e.mati=true;bip(400,.2,'triangle');var xp=e.bos?60:(e.musuh?20:8);P.xp+=xp;toast('☠️ '+e.n+' tumbang · +'+xp+' XP');
  if(e.drop)for(var k in e.drop){tambah(k,e.drop[k]);toast('+'+e.drop[k]+' '+ITEM[k][1])}
  if(e.zombie&&Math.random()<.5)tambah('daging',1);if(e.id==='bandit')Q.n.banditMati=true;if(e.id==='raja'){Q.n.rajaMati=true}
  if(e.def&&e.def.musuh){e.respawn=Date.now()+(e.bos?600000:240000)}
  naikLevel();cekQuest()}}
function naikLevel(){var need=P.lv*40;if(P.xp>=need){P.xp-=need;P.lv++;P.hp=20;toast('⬆️ LEVEL '+P.lv+'! HP pulih');bip(700,.2,'sine');bip(1000,.3,'sine')}}
function getar(ms){try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}
function luka(n,sumber){if(P.mati)return;P.hp-=n;I('dmg').style.opacity=1;setTimeout(function(){I('dmg').style.opacity=0},180);getar(60);bip(90,.15,'sawtooth',.06);if(P.hp<=0){P.hp=0;P.mati=Date.now();matiLayar(sumber)}}
function matiLayar(sumber){var hilang={};['koin','apel','roti'].forEach(function(k){if(INV[k]){hilang[k]=Math.ceil(INV[k]/2);tambah(k,-hilang[k])}});
 dialog('💀 KAMU MATI','Tewas oleh '+(sumber||'sesuatu')+'. Sebagian koin & makanan hilang. Dunia & bangunanmu tetap tersimpan.',[{l:'Bangkit di desa',f:function(){P.x=DESA.x+2.5;P.z=DESA.z+2.5;P.y=DESA.y+2;P.hp=20;P.lapar=14;P.mati=0;MOBS.forEach(function(m){m.agro=false});simpan()}}])}

/* ---------- NPC & dialog ---------- */
var dlgOpen=false;
function dialog(judul,teks,opts){var d=I('dlg');dlgOpen=true;d.className='on';d.innerHTML='<h4>'+judul+'</h4><p>'+teks+'</p><div class="o">'+(opts||[{l:'Tutup'}]).map(function(o,i){return '<div data-i="'+i+'">'+o.l+'</div>'}).join('')+'</div>';
 var os=d.querySelectorAll('.o div');os.forEach(function(el){el.addEventListener('pointerdown',function(ev){ev.stopPropagation();var o=(opts||[{}])[+el.getAttribute('data-i')];d.className='';dlgOpen=false;setTimeout(function(){o&&o.f&&o.f()},40)})})}
function spawnNPC(){NPCS=[];var pos={kepala:[DESA.x+2,DESA.z-3],pandai:[DESA.x+8,DESA.z-3],petani:[DESA.x-5,DESA.z+3],dukun:[DESA.x+8,DESA.z+9],anak:[DESA.x-2,DESA.z+5],bandit:[BUKIT.x,BUKIT.z],bandit2:[BUKIT.x+3,BUKIT.z+2],raja:[MENARA.x,MENARA.z]};
 NPC_DEF.forEach(function(d){var p=pos[d.id];var y=tinggi(p[0],p[1])+1;var e={id:d.id,n:d.n,c:d.c,b:d.b,x:p[0]+.5,z:p[1]+.5,y:y,hx:p[0]+.5,hz:p[1]+.5,def:d,musuh:!!d.musuh,bos:!!d.bos,hp:d.hp||20,hpMax:d.hp||20,dmg:d.dmg||0,drop:d.drop,mati:false,cd:0,flash:0,wander:0};if(d.musuh){var st=(SAVE_NPC||{})[d.id];if(st&&st.respawn&&st.respawn>Date.now()){e.mati=true;e.respawn=st.respawn}}NPCS.push(e)})}
var SAVE_NPC=null;
function bicara(e){var d=e.def;if(d.musuh){return dialog('⚔️ '+e.n,e.bos?'"Hahaha! Anak desa mau jadi pahlawan? Menara ini kuburanmu."':'"Serahkan koinmu, atau kutebas!"',[{l:'⚔️ Lawan!',f:function(){e.agro=true}},{l:'💰 Bayar 3 koin (dia pergi sebentar)',f:function(){if((INV.koin||0)<3)return toast('koin kurang');tambah('koin',-3);e.agro=false;e.cdTenang=Date.now()+60000;toast(e.n+' tertawa dan mundur.')}},{l:'Kabur'}])}
 if(d.quest){Q.n.lurah=true;var q=QUEST[Q.i];var selesai=q&&q.c();
  if(!q)return dialog('👑 '+e.n,'"Kau pahlawan desa ini, '+NAMA_PEMAIN+'. Bangun apa pun yang kau mau — dunia ini milikmu sekarang."',[{l:'Terima kasih, Pak'}]);
  if(selesai){return dialog('👑 '+e.n,'"Bagus sekali! Quest *'+q.t+'* selesai." Hadiah: '+Object.keys(q.r).map(function(k){return q.r[k]+' '+ITEM[k][1]}).join(', '),[{l:'Ambil hadiah',f:function(){for(var k in q.r)tambah(k,q.r[k]);Q.i++;questBaruKirim={no:Q.i,t:q.t};P.xp+=15;naikLevel();bip(700,.2,'sine');cekQuest();simpan();if(QUEST[Q.i])setTimeout(function(){dialog('👑 '+e.n,'"Quest berikutnya: *'+QUEST[Q.i].t+'*. '+QUEST[Q.i].d+'"')},200)}}])}
  return dialog('👑 '+e.n,(Q.i===0?'"Selamat datang di Desa Harapan, '+NAMA_PEMAIN+'. Desa kami diganggu bandit dan zombie tiap malam. Bantu kami, dan desa ini jadi rumahmu." ':'')+'"Quest saat ini: *'+q.t+'* — '+q.d+'"',[{l:'Siap!'},{l:'Ceritakan desa ini',f:function(){dialog('👑 '+e.n,'"Dulu desa ini makmur, sampai Garong si Raja Bandit membangun menara di utara. Bu Sari kehilangan suaminya, Mbah Wiro menutup diri. Hanya Nina yang masih tertawa. Kau harapan terakhir kami."')}}])}
 if(d.toko){var opsi=[];for(var k in d.toko){(function(k){var h=d.toko[k];opsi.push({l:'Beli '+ITEM[k][0]+' '+ITEM[k][1]+' — '+h.koin+' koin',f:function(){if((INV.koin||0)<h.koin)return toast('koin kurang ('+(INV.koin||0)+'/'+h.koin+')');tambah('koin',-h.koin);tambah(k,1);toast('+1 '+ITEM[k][1]);bip(600,.1);bicara(e)}})})(k)}
  for(var j in d.jual){(function(j){var harga=d.jual[j];opsi.push({l:'Jual '+ITEM[j][0]+' '+ITEM[j][1]+' → '+harga+' koin',f:function(){if(!INV[j])return toast('tidak punya '+ITEM[j][1]);tambah(j,-1);tambah('koin',harga);bip(500,.08);bicara(e)}})})(j)}
  if(d.id==='petani'&&!Q.n.apelSerah&&Q.i>=6)opsi.unshift({l:'🍎 Serahkan 6 apel (quest)',f:function(){if((INV.apel||0)<6)return toast('apel kurang');tambah('apel',-6);Q.n.apelSerah=true;toast('Mas Dodi: "Makasih banyak!"');cekQuest()}});
  opsi.push({l:'Pergi'});var sapa={pandai:'"Butuh senjata? Pedang besi buatanku tak pernah tumpul."',petani:'"Panen apel lagi bagus. Mau tukar?"',dukun:'"Hmm… aku mencium bau petualang. Ramuanku menyembuhkan luka. Peta tua ini… menunjukkan harta di bawah pohon tertinggi."'}[d.id];
  return dialog(ITEM.koin[0]+' '+e.n+' · koinmu: '+(INV.koin||0),sapa,opsi)}
 if(d.ngobrol){var t=d.ngobrol[Math.floor(Math.random()*d.ngobrol.length)];return dialog('🧒 '+e.n,'"'+t+'"',[{l:'Oke'},{l:'🌸 Kasih bunga',f:function(){if(!INV.bunga)return toast('tidak punya bunga');tambah('bunga',-1);tambah('koin',1);toast('Nina senang! +1 koin')}}])}}
function cekQuest(){var q=QUEST[Q.i];var el=I('quest');if(!q){el.innerHTML='<b>🏆 SEMUA QUEST SELESAI</b><br>Dunia bebas: bangun & jelajah.';return}var ok=q.c();el.innerHTML='<b>📜 Quest '+(Q.i+1)+'/'+QUEST.length+(ok?' ✔':'')+'</b><br>'+q.t+(ok?'<br><i style="color:#5ce09a">→ lapor ke Pak Lurah</i>':'<br><span style="color:#aab">'+q.d.slice(0,70)+(q.d.length>70?'…':'')+'</span>')+arahTeks()}
function arahTeks(){var tg=null,ik='';if(Q.i<=0||Q.i===6||!Q.n.lurah){tg=DESA;ik='🚩 desa'}if(Q.i===9){tg=BUKIT;ik='⚔️ bandit'}if(Q.i===10&&INV.peta){tg=HARTA;ik='🗺️ harta'}if(Q.i===11){tg=MENARA;ik='🏰 menara'}if(!tg)return'';var dx=tg.x-P.x,dz=tg.z-P.z,d=Math.hypot(dx,dz)|0;var ang=Math.atan2(-dx,-dz)-P.yaw;var dir=['↑','↗','→','↘','↓','↙','←','↖'][((Math.round(ang/(Math.PI/4))%8)+8)%8];return'<br>'+ik+' '+dir+' '+d+'m'}

/* ---------- mob ---------- */
function spawnMob(){var gelap=Math.sin(WAKTU*Math.PI*2)<0.05;if(!gelap||MOBS.filter(function(m){return!m.mati}).length>=6)return;if(Math.random()>.02)return;var a=Math.random()*6.28,r=14+Math.random()*10;var x=Math.floor(P.x+Math.cos(a)*r),z=Math.floor(P.z+Math.sin(a)*r);if(Math.hypot(x-DESA.x,z-DESA.z)<10)return;var y=tinggi(x,z)+1;var cr=Math.random()<.25;MOBS.push({n:cr?'Creeper':'Zombie',zombie:!cr,creeper:cr,c:cr?[.3,.75,.3]:[.35,.55,.35],b:cr?[.25,.65,.25]:[.2,.35,.6],x:x+.5,y:y,z:z+.5,hp:cr?10:14,hpMax:cr?10:14,dmg:cr?9:2,agro:true,cd:0,flash:0,lahir:Date.now()})}
function updEnt(dt){var all=NPCS.concat(MOBS);var terang=Math.sin(WAKTU*Math.PI*2)>0.15;
 for(var i=0;i<all.length;i++){var e=all[i];if(e.mati){if(e.respawn&&Date.now()>e.respawn){e.mati=false;e.hp=e.hpMax;e.x=e.hx;e.z=e.hz;e.agro=false}continue}
  e.flash=Math.max(0,e.flash-dt);var dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz);
  if(e.zombie&&terang&&Math.random()<dt*.3){e.hp-=3;e.flash=.1;if(e.hp<=0)e.mati=true}
  var musuh=e.musuh||e.zombie||e.creeper;var kejar=musuh&&(e.agro||d<(e.bos?10:7))&&!(e.cdTenang>Date.now())&&!P.mati;
  var vx=0,vz=0,sp=e.creeper?2.6:(e.bos?2.4:2.1);
  if(kejar&&d>1.1){vx=dx/d*sp;vz=dz/d*sp;e.agro=true;if(e.def&&e.def.jauh&&Math.hypot(e.x-e.hx,e.z-e.hz)>30){vx=(e.hx-e.x)*.2;vz=(e.hz-e.z)*.2;e.agro=false}}
  else if(!musuh||!kejar){e.wander-=dt;if(e.wander<=0){e.wander=2+Math.random()*4;var a=Math.random()*6.28;e.wx=Math.cos(a)*.8;e.wz=Math.sin(a)*.8;if(Math.hypot(e.x-e.hx,e.z-e.hz)>5){e.wx=(e.hx-e.x)*.2;e.wz=(e.hz-e.z)*.2}}vx=e.wx||0;vz=e.wz||0}
  var nx=e.x+vx*dt,nz=e.z+vz*dt;var gy=Math.floor(e.y);
  if(!solidAt(nx,e.y+.2,e.z)&&!solidAt(nx,e.y+1,e.z))e.x=nx;else if(!solidAt(nx,e.y+1.2,e.z))e.y+=1;
  if(!solidAt(e.x,e.y+.2,nz)&&!solidAt(e.x,e.y+1,nz))e.z=nz;else if(!solidAt(e.x,e.y+1.2,nz))e.y+=1;
  var t=tinggi(Math.floor(e.x),Math.floor(e.z))+1;var k=Math.floor(e.x)+','+Math.floor(e.y-.1)+','+Math.floor(e.z);if(!solidAt(e.x,e.y-.1,e.z))e.y=Math.max(e.y-8*dt,Math.min(e.y,t));else e.y=Math.floor(e.y);if(e.y<t-3&&!solidAt(e.x,e.y-.1,e.z))e.y=t;
  if(kejar&&d<1.5){e.cd-=dt;if(e.cd<=0){e.cd=e.creeper?0:1.1;if(e.creeper){ledak(e);e.mati=true}else luka(e.dmg,e.n)}}
  if((e.zombie||e.creeper)&&(terang&&d>30||Date.now()-e.lahir>240000))e.mati=true}
 MOBS=MOBS.filter(function(m){return!m.mati})}
function ledak(e){bip(60,.5,'sawtooth',.12);getar(200);var cx=Math.floor(e.x),cy=Math.floor(e.y),cz=Math.floor(e.z);for(var x=-2;x<=2;x++)for(var y=-2;y<=2;y++)for(var z=-2;z<=2;z++){if(x*x+y*y+z*z>5)continue;var b=blok(cx+x,cy+y,cz+z);if(b&&BLOK[b].hp<99&&b!==B.AIR)setBlok(cx+x,cy+y,cz+z,0)}var d=Math.hypot(P.x-e.x,P.z-e.z);if(d<4)luka(Math.round(9*(1-d/4))+1,'ledakan creeper');toast('💥 BOOM!')}

/* ---------- panel ---------- */
function buka(mode){var p=I('pan');p.className='on';var h='';
 if(mode==='inv'){h+='<div class="card"><h3>🎒 INVENTORI · Lv '+P.lv+' · XP '+P.xp+'/'+(P.lv*40)+' · 🪙 '+(INV.koin||0)+'</h3><div class="grid">';var ada=false;for(var k in INV){if(k==='koin')continue;ada=true;var it=ITEM[k]||['❔',k];h+='<div class="it" data-eq="'+k+'"><s>'+it[0]+'</s>'+it[1]+'<br><b>×'+INV[k]+'</b></div>'}if(!ada)h+='<div style="color:#889;font-size:12px">kosong — gali pohon & tanah dulu</div>';h+='</div><p style="font-size:11px;color:#889;margin-top:8px">Ketuk item → taruh ke slot cepat aktif (slot '+(SEL+1)+'). Makanan: apel/roti/daging; ramuan: HP penuh.</p><div class="b sec" data-act="makan_apel">🍎 makan apel</div><div class="b sec" data-act="makan_roti">🍞 makan roti</div><div class="b sec" data-act="makan_daging">🍖 makan daging</div><div class="b sec" data-act="minum">🧪 minum ramuan</div></div>';
  h+='<div class="card"><h3>🛠️ CRAFT '+(mejaDekat()?'· <span style="color:#5ce09a">meja kerja terdeteksi</span>':'· <span style="color:#e0524f">tanpa meja (resep dasar saja)</span>')+'</h3><div class="grid">';RESEP.forEach(function(r,i){var bisa=punya(r.b)&&(!r.meja||mejaDekat());var it=ITEM[Object.keys(r.h)[0]];h+='<div class="it '+(bisa?'ok':'no')+'" data-craft="'+i+'"><s>'+it[0]+'</s>'+r.n+(r.meja?' 🛠️':'')+'<br><b style="font-size:10px;color:#aab">'+Object.keys(r.b).map(function(k){return r.b[k]+' '+ITEM[k][1]}).join(' + ')+'</b></div>'});h+='</div></div>'}
 if(mode==='menu'){h+='<div class="card"><h3>☰ '+NAMA+' · Hari '+HARI+'</h3><p style="font-size:12px;line-height:1.5;color:#cbd">Pemain: <b>'+NAMA_PEMAIN+'</b> · Level '+P.lv+' · Quest '+Math.min(Q.i+1,QUEST.length)+'/'+QUEST.length+' · Balok diubah: '+Object.keys(ED).length+'<br>Tersimpan terakhir: '+(lastSave?new Date(lastSave).toLocaleTimeString():'-')+'</p><div class="b" data-act="simpan">💾 Simpan sekarang</div><div class="b sec" data-act="nama">✏️ Nama dunia</div><div class="b sec" data-act="tidur">🛏️ Tidur (lewati malam, butuh di dalam ruangan)</div><div class="b sec" data-act="desa">🚩 Teleport ke desa (−2 koin)</div></div>';
  h+='<div class="card"><h3>📜 QUEST</h3>'+QUEST.map(function(q,i){return '<div style="font-size:12px;padding:5px 0;border-bottom:1px solid #222;color:'+(i<Q.i?'#5ce09a':i===Q.i?'#ffd84a':'#667')+'">'+(i<Q.i?'✔':i===Q.i?'▶':'🔒')+' '+(i+1)+'. '+q.t+(i===Q.i?'<br><span style="color:#aab">'+q.d+'</span>':'')+'</div>'}).join('')+'</div>';
  h+='<div class="card"><h3>🎮 CARA MAIN</h3><p style="font-size:12px;line-height:1.55;color:#cbd">• Joystick kiri = jalan · geser layar kanan = lihat sekeliling · LOMPAT<br>• GALI/SERANG: tahan ke balok (bar merah = HP balok) atau pukul musuh/bandit<br>• PASANG: taruh balok dari slot cepat yang dipilih · BICARA muncul saat dekat NPC<br>• Malam = zombie & creeper. Bangun dinding + obor, atau tidur di ruangan tertutup<br>• Lapar turun tiap waktu → makan apel/roti; lapar 0 = HP berkurang<br>• Bandit di bukit timur bisa diajak bicara, dibayar, atau dilawan; Raja Bandit di menara utara<br>• Dunia tersimpan otomatis ke bot (tiap 20 dtk & saat keluar). Buka lagi dari WhatsApp kapan saja.</p></div>'}
 p.innerHTML=h+'<div class="b red" data-act="tutup">✕ TUTUP</div>';
 p.querySelectorAll('[data-eq]').forEach(function(el){el.onclick=function(){HOT[SEL]=el.getAttribute('data-eq');hot();toast(ITEM[HOT[SEL]][1]+' → slot '+(SEL+1))}});
 p.querySelectorAll('[data-craft]').forEach(function(el){el.onclick=function(){craft(RESEP[+el.getAttribute('data-craft')])}});
 p.querySelectorAll('[data-act]').forEach(function(el){el.onclick=function(){var a=el.getAttribute('data-act');if(a==='tutup')p.className='';if(a==='simpan')simpan(true);if(a.indexOf('makan_')===0)makan(a.slice(6));if(a==='minum')minum();if(a==='nama'){var n=prompt('Nama dunia/proyek:',NAMA);if(n){NAMA=n.slice(0,30);dirty=true;simpan(true)}}
  if(a==='tidur'){if(!tertutup())return toast('tidak aman: harus di ruangan tertutup (ada atap & dinding)');if(Math.sin(WAKTU*Math.PI*2)>0.1)return toast('belum malam');WAKTU=0.27;HARI++;P.hp=Math.min(20,P.hp+6);MOBS=[];toast('🌅 Pagi hari '+HARI);p.className='';cekQuest();simpan()}
  if(a==='desa'){if((INV.koin||0)<2)return toast('koin kurang');tambah('koin',-2);P.x=DESA.x+2.5;P.z=DESA.z+2.5;P.y=DESA.y+2;p.className=''}}})}
function tertutup(){var x=Math.floor(P.x),y=Math.floor(P.y),z=Math.floor(P.z);for(var dy=1;dy<=6;dy++)if(padat(blok(x,y+dy,z))){var sisi=0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){for(var s=1;s<=6;s++)if(padat(blok(x+d[0]*s,y+1,z+d[1]*s))){sisi++;break}});return sisi===4}return false}

/* ---------- HUD ---------- */
function hud(){var jam=Math.floor(((WAKTU+.0)%1)*24),mnt=Math.floor(((WAKTU*24)%1)*60);I('stat').innerHTML='<b>❤️ '+Math.ceil(P.hp)+'/20</b><div class="meter"><i style="width:'+(P.hp*5)+'%;background:#e0524f"></i></div><b>🍗 '+Math.ceil(P.lapar)+'/20</b><div class="meter"><i style="width:'+(P.lapar*5)+'%;background:#f0a030"></i></div>'+'🌞 Hari '+HARI+' · '+(jam<10?'0':'')+jam+':'+(mnt<10?'0':'')+mnt+(Math.sin(WAKTU*Math.PI*2)<0.05?' 🌙 <span style="color:#f88">malam</span>':'')+' · Lv '+P.lv+' · 🪙 '+(INV.koin||0);
 var e=entDepan(4);I('bTalk').style.display=e&&!e.zombie&&!e.creeper?'flex':'none';if(e&&!e.zombie&&!e.creeper)I('bTalk').innerHTML=e.musuh?'⚔️<br>'+e.n.split(' ')[0]:'💬<br>'+e.n.split(' ')[0]}

/* ---------- save/load ---------- */
var NAMA_PEMAIN='Pemain';
function simpan(manual){var body={seed:SEED,nama:NAMA,ed:ED,p:{x:P.x,y:P.y,z:P.z,yaw:P.yaw,hp:P.hp,lapar:P.lapar,xp:P.xp,lv:P.lv},inv:INV,q:Q,hari:HARI,waktu:WAKTU,npc:{},dMenit:Math.round((Date.now()-menitAwal)/60000),questBaru:questBaruKirim};menitAwal=Date.now();questBaruKirim=null;
 NPCS.forEach(function(n){if(n.def.musuh)body.npc[n.id]={respawn:n.respawn||0,mati:n.mati}});body.hot=HOT;
 var s=JSON.stringify(body);try{navigator.sendBeacon&&!manual&&document.hidden?navigator.sendBeacon('/w/'+TOK+'/save',new Blob([s],{type:'application/json'})):fetch('/w/'+TOK+'/save',{method:'POST',headers:{'Content-Type':'application/json'},body:s}).then(function(r){return r.json()}).then(function(j){if(j.ok){lastSave=Date.now();dirty=false;if(manual)toast('💾 tersimpan')}else toast('gagal simpan: '+(j.pesan||''))}).catch(function(){if(manual)toast('gagal simpan (offline?)')})}catch(e){}}
function muat(){fetch('/w/'+TOK+'/load').then(function(r){return r.json()}).then(function(j){NAMA_PEMAIN=j.nama||'Pemain';var w=j.dunia;
 if(w){SEED=w.seed;ED=w.ed||{};INV=w.inv||{};Q=w.q||{i:0,n:{}};HARI=w.hari||1;WAKTU=w.waktu||.3;NAMA=w.nama||'Dunia';SAVE_NPC=w.npc||{};if(w.p){P.x=w.p.x;P.y=w.p.y;P.z=w.p.z;P.yaw=w.p.yaw||0;P.hp=w.p.hp||20;P.lapar=w.p.lapar==null?20:w.p.lapar;P.xp=w.p.xp||0;P.lv=w.p.lv||1}if(w.hot)HOT=w.hot;
  I('spInfo').innerHTML='Selamat datang kembali, <b>'+NAMA_PEMAIN+'</b>!<br>Dunia: <b>'+NAMA+'</b> · Hari '+HARI+' · Level '+P.lv+' · Quest '+Math.min(Q.i+1,QUEST.length)+'/'+QUEST.length+'<br>'+Object.keys(ED).length+' balok diubah · '+(w.menit||0)+' menit dimainkan'}
 else{SEED=(Math.random()*1e9)|0;NAMA='Dunia '+(j.slot||1);P.x=DESA.x+2.5;P.z=DESA.z+6.5;P.y=DESA.y+2;I('spInfo').innerHTML='Dunia baru untuk <b>'+NAMA_PEMAIN+'</b> (slot '+(j.slot||1)+').<br>Kamu terbangun di Desa Harapan. Bicaralah dengan Pak Lurah untuk quest pertama.<br>Seed: '+SEED}
 siapDunia();I('spGo').style.display='inline-block'}).catch(function(){I('spInfo').textContent='Gagal memuat dari server. Coba buka ulang link dari WhatsApp.'})}
function siapDunia(){var r=rnd(SEED);DESA.y=12;BUKIT={x:30+Math.floor(r()*10),z:-6+Math.floor(r()*12)};MENARA={x:-10+Math.floor(r()*20),z:-44-Math.floor(r()*8)};
 // harta: pohon tertinggi dalam radius 40
 var best=null,bh=-1;for(var x=-40;x<=40;x+=1)for(var z=-40;z<=40;z+=1)if(pohonDi(x,z)){var h=tinggi(x,z);if(h>bh){bh=h;best={x:x,z:z}}}HARTA=best||{x:12,z:12};
 spawnNPC();hot();cekQuest()}

/* ---------- input ---------- */
var running=false,last=0;
function loop(t){requestAnimationFrame(loop);if(!running)return;var dt=Math.min(.05,(t-last)/1000||0);last=t;
 if(!P.mati&&!dlgOpen&&I('pan').className!=='on'){fisika(dt);if(holdAct){actT-=dt;if(actT<=0){actT=.18;aksi()}}}
 WAKTU+=dt/600;if(WAKTU>=1){WAKTU-=1;HARI++;toast('🌅 Hari '+HARI);cekQuest()}
 P.lapar=Math.max(0,P.lapar-dt/45);if(P.lapar<=0&&Math.random()<dt*.5)luka(1,'kelaparan');if(P.lapar>=18&&P.hp<20&&Math.random()<dt*.4)P.hp=Math.min(20,P.hp+1);
 spawnMob();updEnt(dt);render();if((t|0)%10===0)hud();
 if(dirty&&Date.now()-lastSave>20000){lastSave=Date.now();simpan()}}
requestAnimationFrame(loop);
var holdAct=false,actT=0;
// joystick
(function(){var j=I('joy'),k=I('knob'),id=null,cx=0,cy=0;j.addEventListener('pointerdown',function(e){id=e.pointerId;var r=j.getBoundingClientRect();cx=r.left+60;cy=r.top+60;mv(e)});function mv(e){if(e.pointerId!==id)return;var dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy),m=Math.min(d,48);if(d>0){dx=dx/d*m;dy=dy/d*m}joy.x=dx/48;joy.y=dy/48;k.style.left=(38+dx)+'px';k.style.top=(38+dy)+'px'}
 window.addEventListener('pointermove',mv);function up(e){if(e.pointerId!==id)return;id=null;joy.x=0;joy.y=0;k.style.left='38px';k.style.top='38px'}window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up)})();
// look
(function(){var id=null,lx=0,ly=0;cv.addEventListener('pointerdown',function(e){if(e.clientX<innerWidth*.4&&e.clientY>innerHeight*.55)return;id=e.pointerId;lx=e.clientX;ly=e.clientY});window.addEventListener('pointermove',function(e){if(e.pointerId!==id)return;P.yaw-=(e.clientX-lx)*.005;P.pitch=Math.max(-1.4,Math.min(1.4,P.pitch-(e.clientY-ly)*.005));lx=e.clientX;ly=e.clientY});window.addEventListener('pointerup',function(e){if(e.pointerId===id)id=null})})();
I('bJump').addEventListener('pointerdown',function(e){e.preventDefault();jump=true});
I('bAct').addEventListener('pointerdown',function(e){e.preventDefault();holdAct=true;actT=0;galiT=null});['pointerup','pointercancel','pointerleave'].forEach(function(ev){I('bAct').addEventListener(ev,function(){holdAct=false})});
I('bPlace').addEventListener('pointerdown',function(e){e.preventDefault();pasang()});
I('bTalk').addEventListener('pointerdown',function(e){e.preventDefault();var en=entDepan(4);if(en)bicara(en)});
I('bInv').addEventListener('pointerdown',function(e){e.preventDefault();I('pan').className==='on'?I('pan').className='':buka('inv')});
I('bMenu').addEventListener('pointerdown',function(e){e.preventDefault();I('pan').className==='on'?I('pan').className='':buka('menu')});
I('spGo').addEventListener('pointerdown',function(){I('splash').style.display='none';running=true;bip(440,.1,'sine');bip(660,.15,'sine');if(Q.i===0&&!Q.n.lurah)setTimeout(function(){dialog('📜 Petunjuk','Kamu terbangun di Desa Harapan. Cari <b>Pak Lurah Jaya</b> (di dekat sumur, penanda 🚩 di HUD) untuk memulai quest. Malam pertama datang cepat — kumpulkan kayu!')},600)});
document.addEventListener('visibilitychange',function(){if(document.hidden&&running)simpan()});window.addEventListener('pagehide',function(){if(running)simpan()});
muat();
`

export default { handleDunia, buatTokenDunia, ringkasDunia, hapusDunia, setOnQuest }
