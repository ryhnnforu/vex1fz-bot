/* lib/akinengine.js — MESIN AKINATOR v7.35.0 (nol dependensi, dua-arah)
 * ------------------------------------------------------------------
 * Dipakai DUA arah dari SATU file ini:
 *  1. Node: test-v735 mengimpor via data: URL (lihat scripts/test-v735.js)
 *  2. Webview: lib/akinatorgame.js menyisip file ini MENTAH ke tag skrip HTML
 * SYARAT KERAS: tanpa import/export/require/process/backtick — JS murni.
 * Logika = port persis mesin chat features/akinator.js (skor, bobot, ambang).
 * Kode klaim: AKIN-<asked>x<tebakan>-<CCCC> (FNV-1a + salt, mirror di
 * features/akinator.js fungsi verifikasiKlaim — test-v735 memastikan paritas).
 */
var AKIN_MIN_TANYA = 8
var AKIN_MAKS_TANYA = 20
var AKIN_MAKS_TEBAK = 3
var AKIN_SALT = 'J1N-L4MPU-7'

var AKIN_Q = [
  { k: 'pria', t: 'Apakah karaktermu laki-laki?' },
  { k: 'indo', t: 'Apakah dia berasal dari Indonesia?' },
  { k: 'nyata', t: 'Apakah dia orang yang NYATA (bukan fiksi)?' },
  { k: 'politik', t: 'Apakah dia politikus atau pejabat negara?' },
  { k: 'presiden', t: 'Apakah dia pernah atau sedang menjadi presiden?' },
  { k: 'pahlawan', t: 'Apakah dia pahlawan nasional?' },
  { k: 'militer', t: 'Apakah dia berasal dari kalangan militer?' },
  { k: 'proklamator', t: 'Apakah dia proklamator kemerdekaan Indonesia?' },
  { k: 'ordebaru', t: 'Apakah dia pemimpin era Orde Baru?' },
  { k: 'ulama', t: 'Apakah dia ulama atau pendakwah?' },
  { k: 'artis', t: 'Apakah dia artis / pemain film / sinetron?' },
  { k: 'musik', t: 'Apakah dia penyanyi atau musisi?' },
  { k: 'dangdut', t: 'Apakah dia penyanyi dangdut?' },
  { k: 'komedi', t: 'Apakah dia komedian atau komika?' },
  { k: 'olahraga', t: 'Apakah dia atlet atau olahragawan?' },
  { k: 'bola', t: 'Apakah dia pemain sepak bola?' },
  { k: 'bulu', t: 'Apakah dia atlet bulu tangkis?' },
  { k: 'pildun', t: 'Apakah dia pernah juara Piala Dunia?' },
  { k: 'gamer', t: 'Apakah dia YouTuber, gamer, atau konten kreator?' },
  { k: 'kpop', t: 'Apakah dia idol K-Pop?' },
  { k: 'barat', t: 'Apakah dia berasal dari Barat (Amerika / Eropa)?' },
  { k: 'hollywood', t: 'Apakah dia aktor Hollywood?' },
  { k: 'luarnegeri', t: 'Apakah dia berkarier di luar negeri?' },
  { k: 'anime', t: 'Apakah dia karakter anime?' },
  { k: 'kartun', t: 'Apakah dia karakter kartun (bukan anime)?' },
  { k: 'disney', t: 'Apakah dia karakter Disney?' },
  { k: 'superhero', t: 'Apakah dia superhero?' },
  { k: 'jahat', t: 'Apakah dia tokoh JAHAT / penjahat?' },
  { k: 'putri', t: 'Apakah dia putri, ratu, atau princess?' },
  { k: 'meninggal', t: 'Apakah dia sudah meninggal?' },
  { k: 'muda', t: 'Apakah dia masih muda (di bawah 30 tahun)?' },
  { k: 'tua', t: 'Apakah dia berumur di atas 50 tahun?' },
  { k: 'ninja', t: 'Apakah dia seorang ninja?' },
  { k: 'karet', t: 'Apakah tubuhnya terbuat dari karet?' },
  { k: 'iblis', t: 'Apakah dia melawan iblis atau setan?' },
  { k: 'kacamata', t: 'Apakah dia memakai kacamata atau penutup mata?' },
  { k: 'pedang', t: 'Apakah dia memakai pedang?' },
  { k: 'kuning', t: 'Apakah tubuhnya berwarna kuning?' },
  { k: 'botak', t: 'Apakah dia botak (tidak punya rambut)?' },
  { k: 'es', t: 'Apakah dia punya kekuatan es?' },
  { k: 'terbang', t: 'Apakah dia bisa terbang?' },
  { k: 'jubah', t: 'Apakah dia memakai jubah?' },
  { k: 'palu', t: 'Apakah senjatanya berupa palu?' },
  { k: 'badut', t: 'Apakah dia seorang badut?' },
  { k: 'kembar', t: 'Apakah dia anak kembar?' }
]

var AKIN_MENTAH = [
  ['Soekarno', '👨🏛️', 'Proklamator & presiden pertama RI', { pria: 1, indo: 1, nyata: 1, politik: 1, presiden: 1, proklamator: 1, meninggal: 1, tua: 1 }],
  ['Suharto', '🪖', 'Presiden ke-2 RI, era Orde Baru', { pria: 1, indo: 1, nyata: 1, politik: 1, presiden: 1, ordebaru: 1, militer: 1, meninggal: 1, tua: 1 }],
  ['B.J. Habibie', '✈️', 'Presiden ke-3 RI, bapak teknologi', { pria: 1, indo: 1, nyata: 1, politik: 1, presiden: 1, meninggal: 1, tua: 1 }],
  ['Gus Dur', '🧔', 'Presiden ke-4 RI, ulama NU', { pria: 1, indo: 1, nyata: 1, politik: 1, presiden: 1, ulama: 1, meninggal: 1, tua: 1 }],
  ['Megawati', '👩', 'Presiden ke-5 RI', { pria: -1, indo: 1, nyata: 1, politik: 1, presiden: 1, meninggal: -1, tua: 1 }],
  ['SBY', '🎖️', 'Presiden ke-6 RI', { pria: 1, indo: 1, nyata: 1, politik: 1, presiden: 1, militer: 1, meninggal: -1, tua: 1 }],
  ['Jokowi', '👔', 'Presiden ke-7 RI', { pria: 1, indo: 1, nyata: 1, politik: 1, presiden: 1, militer: -1, meninggal: -1, tua: 1 }],
  ['Prabowo', '🫡', 'Presiden ke-8 RI', { pria: 1, indo: 1, nyata: 1, politik: 1, presiden: 1, militer: 1, meninggal: -1, tua: 1 }],
  ['R.A. Kartini', '📚', 'Pahlawan emansipasi wanita', { pria: -1, indo: 1, nyata: 1, pahlawan: 1, meninggal: 1 }],
  ['Pangeran Diponegoro', '🐎', 'Pahlawan Perang Jawa', { pria: 1, indo: 1, nyata: 1, pahlawan: 1, meninggal: 1, tua: 1, pedang: 1 }],
  ['Jenderal Sudirman', '🇮🇩', 'Jenderal besar, perang gerilya', { pria: 1, indo: 1, nyata: 1, pahlawan: 1, militer: 1, meninggal: 1 }],
  ['Bung Tomo', '📢', 'Orator Surabaya', { pria: 1, indo: 1, nyata: 1, pahlawan: 1, meninggal: 1 }],
  ['Raffi Ahmad', '🤵', 'Sultan Andara', { pria: 1, indo: 1, nyata: 1, artis: 1, meninggal: -1 }],
  ['Nagita Slavina', '👰', 'Gigi, istri Raffi', { pria: -1, indo: 1, nyata: 1, artis: 1, meninggal: -1 }],
  ['Ayu Ting Ting', '🎤', 'Pedangdut Geboy Mujair', { pria: -1, indo: 1, nyata: 1, artis: 1, musik: 1, dangdut: 1, meninggal: -1 }],
  ['Agnez Mo', '🌟', 'Penyanyi go international', { pria: -1, indo: 1, nyata: 1, artis: 1, musik: 1, dangdut: -1, luarnegeri: 1, meninggal: -1 }],
  ['BCL', '💃', 'Penyanyi & aktris', { pria: -1, indo: 1, nyata: 1, artis: 1, musik: 1, dangdut: -1, meninggal: -1 }],
  ['Rhoma Irama', '👑', 'Raja dangdut', { pria: 1, indo: 1, nyata: 1, musik: 1, dangdut: 1, tua: 1, meninggal: -1 }],
  ['Iwan Fals', '🎸', 'Legenda musik folk', { pria: 1, indo: 1, nyata: 1, musik: 1, dangdut: -1, tua: 1, meninggal: -1 }],
  ['Ariel Noah', '🎵', 'Vokalis band Noah', { pria: 1, indo: 1, nyata: 1, artis: 1, musik: 1, meninggal: -1 }],
  ['Sule', '🤡', 'Komedian', { pria: 1, indo: 1, nyata: 1, komedi: 1, artis: 1, meninggal: -1 }],
  ['Andre Taulany', '😎', 'Komedian, eks vokalis Stinky', { pria: 1, indo: 1, nyata: 1, komedi: 1, artis: 1, musik: 1, meninggal: -1 }],
  ['Cak Lontong', '🥸', 'Komedian berkumis', { pria: 1, indo: 1, nyata: 1, komedi: 1, artis: 1, musik: -1, meninggal: -1 }],
  ['Taufik Hidayat', '🏸', 'Emas Olimpiade bulu tangkis', { pria: 1, indo: 1, nyata: 1, olahraga: 1, bulu: 1, meninggal: -1 }],
  ['Greysia Polii', '🥇', 'Emas Olimpiade ganda putri', { pria: -1, indo: 1, nyata: 1, olahraga: 1, bulu: 1, meninggal: -1 }],
  ['Egy Maulana', '⚽', 'Pemain timnas Indonesia', { pria: 1, indo: 1, nyata: 1, olahraga: 1, bola: 1, muda: 1, meninggal: -1 }],
  ['Rizky Ridho', '🦅', 'Bek timnas Indonesia', { pria: 1, indo: 1, nyata: 1, olahraga: 1, bola: 1, muda: 1, meninggal: -1 }],
  ['Cristiano Ronaldo', '🐐', 'CR7, Portugal', { pria: 1, indo: -1, nyata: 1, olahraga: 1, bola: 1, barat: 1, pildun: -1, meninggal: -1 }],
  ['Lionel Messi', '🐐', 'GOAT Argentina', { pria: 1, indo: -1, nyata: 1, olahraga: 1, bola: 1, barat: 1, pildun: 1, meninggal: -1 }],
  ['Eko Yuli Irawan', '🏋️', 'Atlet angkat besi', { pria: 1, indo: 1, nyata: 1, olahraga: 1, meninggal: -1 }],
  ['Mike Tyson', '🥊', 'Legenda tinju dunia', { pria: 1, indo: -1, nyata: 1, olahraga: 1, barat: 1, tua: 1, meninggal: -1 }],
  ['Atta Halilintar', '🎥', 'Gen Halilintar', { pria: 1, indo: 1, nyata: 1, gamer: 1, artis: 1, meninggal: -1 }],
  ['Ria Ricis', '📱', 'Ratu squishy', { pria: -1, indo: 1, nyata: 1, gamer: 1, meninggal: -1 }],
  ['Jess No Limit', '🎮', 'Gamer MLBB', { pria: 1, indo: 1, nyata: 1, gamer: 1, 'artis': -1, meninggal: -1 }],
  ['Windah Basudara', '😂', 'Streamer bocil kematian', { pria: 1, indo: 1, nyata: 1, gamer: 1, komedi: 1, meninggal: -1 }],
  ['MrBeast', '💰', 'YouTuber terbesar dunia', { pria: 1, indo: -1, nyata: 1, gamer: 1, barat: 1, meninggal: -1 }],
  ['Ustaz Abdul Somad', '🕌', 'UAS', { pria: 1, indo: 1, nyata: 1, ulama: 1, meninggal: -1 }],
  ['Ustaz Adi Hidayat', '📖', 'UAH', { pria: 1, indo: 1, nyata: 1, ulama: 1, meninggal: -1 }],
  ['Elon Musk', '🚀', 'Tesla & SpaceX', { pria: 1, indo: -1, nyata: 1, barat: 1, meninggal: -1 }],
  ['Taylor Swift', '🎶', 'Penyanyi pop dunia', { pria: -1, indo: -1, nyata: 1, musik: 1, barat: 1, meninggal: -1 }],
  ['Dwayne Johnson', '💪', 'The Rock', { pria: 1, indo: -1, nyata: 1, artis: 1, hollywood: 1, barat: 1, tua: 1, 'muda': -1, meninggal: -1 }],
  ['Jackie Chan', '🥋', 'Aktor laga Asia', { pria: 1, indo: -1, nyata: 1, artis: 1, hollywood: 1, 'barat': -1, tua: 1, meninggal: -1 }],
  ['Jungkook', '🐰', 'BTS', { pria: 1, indo: -1, nyata: 1, musik: 1, kpop: 1, 'barat': -1, muda: 1, meninggal: -1 }],
  ['Lisa Blackpink', '💜', 'Blackpink', { pria: -1, indo: -1, nyata: 1, musik: 1, kpop: 1, 'barat': -1, muda: 1, meninggal: -1 }],
  ['Tom Holland', '🕷️', 'Spiderman MCU', { pria: 1, indo: -1, nyata: 1, artis: 1, hollywood: 1, barat: 1, muda: 1, meninggal: -1 }],
  ['Naruto', '🍥', 'Hokage Konoha', { pria: 1, indo: -1, nyata: -1, anime: 1, ninja: 1, muda: 1, 'jahat': -1, 'barat': -1 }],
  ['Luffy', '🏴‍☠️', 'Calon Raja Bajak Laut', { pria: 1, indo: -1, nyata: -1, anime: 1, karet: 1, muda: 1, 'ninja': -1, 'barat': -1 }],
  ['Goku', '🐉', 'Super Saiya', { pria: 1, indo: -1, nyata: -1, anime: 1, terbang: 1, 'muda': -1, 'ninja': -1, 'barat': -1 }],
  ['Eren Yeager', '⚔️', 'Attack on Titan', { pria: 1, indo: -1, nyata: -1, anime: 1, muda: 1, pedang: 1, 'iblis': -1, 'ninja': -1, 'barat': -1 }],
  ['Tanjiro', '🌊', 'Pembasmi iblis', { pria: 1, indo: -1, nyata: -1, anime: 1, muda: 1, iblis: 1, pedang: 1, 'ninja': -1, 'barat': -1 }],
  ['Gojo Satoru', '🕶️', 'Terkuat di Jujutsu', { pria: 1, indo: -1, nyata: -1, anime: 1, kacamata: 1, 'jahat': -1, 'ninja': -1, 'barat': -1 }],
  ['Anya Forger', '🥜', 'Spy x Family', { pria: -1, indo: -1, nyata: -1, anime: 1, muda: 1, 'pedang': -1, 'barat': -1 }],
  ['Mikasa', '🧣', 'Attack on Titan', { pria: -1, indo: -1, nyata: -1, anime: 1, muda: 1, pedang: 1, 'barat': -1 }],
  ['Madara Uchiha', '👺', 'Naruto', { pria: 1, indo: -1, nyata: -1, anime: 1, ninja: 1, jahat: 1, 'barat': -1 }],
  ['Sukuna', '👅', 'Raja kutukan Jujutsu', { pria: 1, indo: -1, nyata: -1, anime: 1, jahat: 1, 'ninja': -1, 'barat': -1 }],
  ['Spongebob', '🧽', 'Krusty Krab', { pria: 1, indo: -1, nyata: -1, kartun: 1, kuning: 1, barat: 1 }],
  ['Doraemon', '🔔', 'Kucing robot', { pria: 1, indo: -1, nyata: -1, kartun: 1, 'kuning': -1, 'barat': -1, botak: 0 }],
  ['Upin & Ipin', '👬', 'Malaysia', { pria: 1, indo: -1, nyata: -1, kartun: 1, muda: 1, botak: 1, kembar: 1, 'barat': -1 }],
  ['Mickey Mouse', '🐭', 'Disney', { pria: 1, indo: -1, nyata: -1, kartun: 1, disney: 1, 'kuning': -1, barat: 1 }],
  ['Masha', '🐻', 'Masha and the Bear', { pria: -1, indo: -1, nyata: -1, kartun: 1, muda: 1, 'putri': -1, 'disney': -1, 'barat': -1 }],
  ['Elsa', '❄️', 'Frozen', { pria: -1, indo: -1, nyata: -1, kartun: 1, putri: 1, disney: 1, muda: 1, es: 1, barat: 1 }],
  ['Cinderella', '👠', 'Sepatu kaca', { pria: -1, indo: -1, nyata: -1, kartun: 1, putri: 1, disney: 1, muda: 1, 'es': -1, barat: 1 }],
  ['Iron Man', '🤖', 'Tony Stark', { pria: 1, indo: -1, nyata: -1, superhero: 1, barat: 1, terbang: 1, 'jubah': -1, 'jahat': -1 }],
  ['Spiderman', '🕷️', 'Peter Parker', { pria: 1, indo: -1, nyata: -1, superhero: 1, barat: 1, muda: 1, 'terbang': -1, 'jubah': -1, 'jahat': -1 }],
  ['Batman', '🦇', 'Bruce Wayne', { pria: 1, indo: -1, nyata: -1, superhero: 1, barat: 1, jubah: 1, 'terbang': -1, 'jahat': -1 }],
  ['Superman', '🦸', 'Krypton', { pria: 1, indo: -1, nyata: -1, superhero: 1, barat: 1, terbang: 1, jubah: 1, 'jahat': -1 }],
  ['Thor', '🔨', 'Dewa petir', { pria: 1, indo: -1, nyata: -1, superhero: 1, barat: 1, terbang: 1, jubah: 1, palu: 1, 'jahat': -1 }],
  ['Gatotkaca', '🇮🇩', 'Superhero Indonesia', { pria: 1, indo: 1, nyata: -1, superhero: 1, terbang: 1, 'jahat': -1 }],
  ['Thanos', '🟣', 'Mad Titan', { pria: 1, indo: -1, nyata: -1, jahat: 1, barat: 1, botak: 1, 'kartun': -1, 'anime': -1 }],
  ['Joker', '🃏', 'Badut kriminal', { pria: 1, indo: -1, nyata: -1, jahat: 1, barat: 1, badut: 1, 'kartun': -1, 'anime': -1 }]
]

var AKIN_FIKSI_NEGATIF = ['politik', 'presiden', 'pahlawan', 'militer', 'proklamator', 'ordebaru', 'ulama', 'artis', 'musik', 'dangdut', 'komedi', 'olahraga', 'bola', 'bulu', 'pildun', 'gamer', 'kpop', 'hollywood', 'luarnegeri']
var AKIN_NYATA_NEGATIF = ['anime', 'kartun', 'superhero', 'jahat', 'putri', 'ninja', 'karet', 'iblis', 'kacamata', 'pedang', 'kuning', 'botak', 'es', 'terbang', 'jubah', 'palu', 'badut', 'disney', 'kembar']

function akinLengkapi (mentah) {
  return mentah.map(function (row) {
    var o = {}, k
    for (k in row[3]) o[k] = row[3][k]
    if (o.indo === 1 && o.barat === undefined) o.barat = -1
    if (o.barat === 1 && o.indo === undefined) o.indo = -1
    if (o.nyata === 1) {
      var semua = AKIN_NYATA_NEGATIF.concat(AKIN_FIKSI_NEGATIF)
      for (var i = 0; i < semua.length; i++) if (o[semua[i]] === undefined) o[semua[i]] = -1
      if (o.meninggal === undefined) o.meninggal = -1
    }
    if (o.nyata === -1) {
      var semua2 = AKIN_FIKSI_NEGATIF.concat(AKIN_NYATA_NEGATIF)
      for (var j = 0; j < semua2.length; j++) if (o[semua2[j]] === undefined) o[semua2[j]] = -1
    }
    return { n: row[0], e: row[1], d: row[2], a: o }
  })
}

var AKIN_CHARS = akinLengkapi(AKIN_MENTAH)

function akinSkorUrut (s) {
  return AKIN_CHARS.map(function (c, i) {
    var pen = 0
    if (s.elim.indexOf(i) >= 0) pen += 1e9
    if (s.tebakan.indexOf(i) >= 0) pen += 1e9
    return { i: i, v: (s.scores[i] || 0) - pen }
  }).sort(function (a, b) { return b.v - a.v })
}

function akinPilihQ (s) {
  var top = akinSkorUrut(s).slice(0, 16)
  var minV = top[0].v
  for (var m = 1; m < top.length; m++) if (top[m].v < minV) minV = top[m].v
  var terbaik = -1, nilaiTerbaik = 0
  for (var qi = 0; qi < AKIN_Q.length; qi++) {
    if (s.asked.indexOf(qi) >= 0) continue
    var Wya = 0, Wtidak = 0, Wnetral = 0
    for (var t = 0; t < top.length; t++) {
      var w = top[t].v - minV + 1
      var v = AKIN_CHARS[top[t].i].a[AKIN_Q[qi].k] || 0
      if (v > 0) Wya += w; else if (v < 0) Wtidak += w; else Wnetral += w
    }
    var nilai = Math.min(Wya, Wtidak) * 2 - Math.abs(Wya - Wtidak) * 0.1 - Wnetral * 0.05
    if (nilai > nilaiTerbaik) { nilaiTerbaik = nilai; terbaik = qi }
  }
  return terbaik
}

function akinHarusTebak (s) {
  if (s.asked.length < AKIN_MIN_TANYA || s.decisive < 4) return false
  if (s.asked.length >= 16) return true
  var t = akinSkorUrut(s)
  return (t[0].v - t[1].v) >= 4
}

function akinBaru () {
  return { asked: [], scores: {}, elim: [], tebakan: [], fase: 'tanya', cur: 0, decisive: 0, tebakIdx: -1 }
}

function akinMulaiTebakan (s) {
  var t = akinSkorUrut(s).filter(function (x) { return x.v > -1e8 })
  if (!t.length) return false
  s.tebakIdx = t[0].i
  if (s.tebakan.indexOf(t[0].i) < 0) s.tebakan.push(t[0].i)
  return true
}

/* terapkan jawaban val (-1..1). Kembalikan 'tanya' | 'tebak' | 'menang' | 'kalah' */
function akinJawab (s, val) {
  var qi, i, v
  if (s.fase === 'tebak') {
    if (val > 0) { s.fase = 'selesai'; return 'menang' }
    if (val < 0) {
      s.elim.push(s.tebakIdx)
      if (s.tebakan.length >= AKIN_MAKS_TEBAK) { s.fase = 'selesai'; return 'kalah' }
      s.fase = 'tanya'
      if (s.asked.length >= AKIN_MAKS_TANYA) {
        if (!akinMulaiTebakan(s)) { s.fase = 'selesai'; return 'kalah' }
        s.fase = 'tebak'; return 'tebak'
      }
      qi = akinPilihQ(s)
      if (qi < 0) {
        if (!akinMulaiTebakan(s)) { s.fase = 'selesai'; return 'kalah' }
        s.fase = 'tebak'; return 'tebak'
      }
      s.cur = qi; s.asked.push(qi)
      s.fase = 'tanya'; return 'tanya'
    }
    s.fase = 'tebak'; return 'tebak'
  }
  var q = AKIN_Q[s.cur]
  for (i = 0; i < AKIN_CHARS.length; i++) {
    v = AKIN_CHARS[i].a[q.k] || 0
    if (v !== 0 && val !== 0) s.scores[i] = (s.scores[i] || 0) + val * v
  }
  if (val !== 0) s.decisive++
  if (s.asked.length >= AKIN_MAKS_TANYA) {
    if (!akinMulaiTebakan(s)) { s.fase = 'selesai'; return 'kalah' }
    s.fase = 'tebak'; return 'tebak'
  }
  if (akinHarusTebak(s)) {
    if (!akinMulaiTebakan(s)) { s.fase = 'selesai'; return 'kalah' }
    s.fase = 'tebak'; return 'tebak'
  }
  qi = akinPilihQ(s)
  if (qi < 0) {
    if (s.asked.length >= AKIN_MIN_TANYA && s.decisive >= 4) {
      if (!akinMulaiTebakan(s)) { s.fase = 'selesai'; return 'kalah' }
      s.fase = 'tebak'; return 'tebak'
    }
    qi = -1
    for (i = 0; i < AKIN_Q.length; i++) { if (s.asked.indexOf(i) < 0) { qi = i; break } }
    if (qi < 0) {
      if (!akinMulaiTebakan(s)) { s.fase = 'selesai'; return 'kalah' }
      s.fase = 'tebak'; return 'tebak'
    }
  }
  s.cur = qi; s.asked.push(qi)
  s.fase = 'tanya'; return 'tanya'
}

function akinHadiah (asked, tebakan) {
  return {
    koin: Math.max(200, 600 - asked * 25 - (tebakan - 1) * 100),
    exp: 60,
    skor: Math.max(100, 1200 - asked * 50 - (tebakan - 1) * 200)
  }
}

/* --- kode klaim: AKIN-<asked>x<tebakan>-<CCCC> --- */
function akinHash (s) {
  var h = 0x811c9dc5
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h
}
function akinCek4 (asked, tebakan) {
  var h = akinHash(asked + 'x' + tebakan + '|' + AKIN_SALT)
  var alf = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  var o = ''
  for (var i = 0; i < 4; i++) { o += alf[h % 32]; h = Math.floor(h / 32) }
  return o
}
function akinKode (asked, tebakan) {
  return 'AKIN-' + asked + 'x' + tebakan + '-' + akinCek4(asked, tebakan)
}
function akinCekKode (kode) {
  var m = /^AKIN-(\d{1,2})X([1-3])-([A-Z2-9]{4})$/.exec(String(kode || '').trim().toUpperCase())
  if (!m) return null
  var asked = parseInt(m[1], 10), tebakan = parseInt(m[2], 10)
  if (asked < 1 || asked > 20) return null
  if (akinCek4(asked, tebakan) !== m[3]) return null
  return { asked: asked, tebakan: tebakan }
}
