/**
 * 🧞 AKINATOR v7.35.0 — dimainkan DI DALAM kartu HTML (game penuh: start →
 * ±20 tanya → 3 tebakan → menang dapat KODE KLAIM koin/EXP/skor).
 * Mesin (45 Q + 70 tokoh): lib/akinengine.js — kartu: lib/akinatorgame.js.
 * Fallback: bila html-app gagal / `.akinator chat` → mode chat (tombol) lawas.
 * Klaim hadiah kartu: `.akinklaim AKIN-..x.-....` (1 kode 1× klaim, maks 3/hari).
 * Butuh: gamestore.akinatorSessions (bot v7.33+) untuk sesi chat.
 */
import { config } from '../config.js'
import { pickRandom } from '../lib/functions.js'
import { addExp, addMoney } from '../lib/rpg.js'
import { catatSkor } from '../lib/lbgame.js'
import { akinatorSessions as sesi } from '../lib/gamestore.js'
import { getUser, saveDB } from '../lib/database.js'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'
const __DIR = dirname(fileURLToPath(import.meta.url))
const TTL = 10 * 60 * 1000 // 10 menit per giliran
const MIN_TANYA = 8 // minimal pertanyaan sebelum menebak
const MAKS_TANYA = 20
const MAKS_TEBAK = 3

/* ------------------------- PERTANYAAN (45) ------------------------- */
export const AKIN_Q = [
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

/* ------------------------- TOKOH (70) -------------------------
 * a: 1 = ya, -1 = tidak, 0/kosong = netral. Pelengkapan otomatis
 * di bawah mengisi nilai turunannya (nyata→bukan fiksi, dst). */
const MENTAH = [
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
  ['Jess No Limit', '🎮', 'Gamer MLBB', { pria: 1, indo: 1, nyata: 1, gamer: 1, artis: -1, meninggal: -1 }],
  ['Windah Basudara', '😂', 'Streamer bocil kematian', { pria: 1, indo: 1, nyata: 1, gamer: 1, komedi: 1, meninggal: -1 }],
  ['MrBeast', '💰', 'YouTuber terbesar dunia', { pria: 1, indo: -1, nyata: 1, gamer: 1, barat: 1, meninggal: -1 }],
  ['Ustaz Abdul Somad', '🕌', 'UAS', { pria: 1, indo: 1, nyata: 1, ulama: 1, meninggal: -1 }],
  ['Ustaz Adi Hidayat', '📖', 'UAH', { pria: 1, indo: 1, nyata: 1, ulama: 1, meninggal: -1 }],
  ['Elon Musk', '🚀', 'Tesla & SpaceX', { pria: 1, indo: -1, nyata: 1, barat: 1, meninggal: -1 }],
  ['Taylor Swift', '🎶', 'Penyanyi pop dunia', { pria: -1, indo: -1, nyata: 1, musik: 1, barat: 1, meninggal: -1 }],
  ['Dwayne Johnson', '💪', 'The Rock', { pria: 1, indo: -1, nyata: 1, artis: 1, hollywood: 1, barat: 1, tua: 1, muda: -1, meninggal: -1 }],
  ['Jackie Chan', '🥋', 'Aktor laga Asia', { pria: 1, indo: -1, nyata: 1, artis: 1, hollywood: 1, barat: -1, tua: 1, meninggal: -1 }],
  ['Jungkook', '🐰', 'BTS', { pria: 1, indo: -1, nyata: 1, musik: 1, kpop: 1, barat: -1, muda: 1, meninggal: -1 }],
  ['Lisa Blackpink', '💜', 'Blackpink', { pria: -1, indo: -1, nyata: 1, musik: 1, kpop: 1, barat: -1, muda: 1, meninggal: -1 }],
  ['Tom Holland', '🕷️', 'Spiderman MCU', { pria: 1, indo: -1, nyata: 1, artis: 1, hollywood: 1, barat: 1, muda: 1, meninggal: -1 }],
  ['Naruto', '🍥', 'Hokage Konoha', { pria: 1, indo: -1, nyata: -1, anime: 1, ninja: 1, muda: 1, jahat: -1, barat: -1 }],
  ['Luffy', '🏴‍☠️', 'Calon Raja Bajak Laut', { pria: 1, indo: -1, nyata: -1, anime: 1, karet: 1, muda: 1, ninja: -1, barat: -1 }],
  ['Goku', '🐉', 'Super Saiya', { pria: 1, indo: -1, nyata: -1, anime: 1, terbang: 1, muda: -1, ninja: -1, barat: -1 }],
  ['Eren Yeager', '⚔️', 'Attack on Titan', { pria: 1, indo: -1, nyata: -1, anime: 1, muda: 1, pedang: 1, iblis: -1, ninja: -1, barat: -1 }],
  ['Tanjiro', '🌊', 'Pembasmi iblis', { pria: 1, indo: -1, nyata: -1, anime: 1, muda: 1, iblis: 1, pedang: 1, ninja: -1, barat: -1 }],
  ['Gojo Satoru', '🕶️', 'Terkuat di Jujutsu', { pria: 1, indo: -1, nyata: -1, anime: 1, kacamata: 1, jahat: -1, ninja: -1, barat: -1 }],
  ['Anya Forger', '🥜', 'Spy x Family', { pria: -1, indo: -1, nyata: -1, anime: 1, muda: 1, pedang: -1, barat: -1 }],
  ['Mikasa', '🧣', 'Attack on Titan', { pria: -1, indo: -1, nyata: -1, anime: 1, muda: 1, pedang: 1, barat: -1 }],
  ['Madara Uchiha', '👺', 'Naruto', { pria: 1, indo: -1, nyata: -1, anime: 1, ninja: 1, jahat: 1, barat: -1 }],
  ['Sukuna', '👅', 'Raja kutukan Jujutsu', { pria: 1, indo: -1, nyata: -1, anime: 1, jahat: 1, ninja: -1, barat: -1 }],
  ['Spongebob', '🧽', 'Krusty Krab', { pria: 1, indo: -1, nyata: -1, kartun: 1, kuning: 1, barat: 1 }],
  ['Doraemon', '🔔', 'Kucing robot', { pria: 1, indo: -1, nyata: -1, kartun: 1, kuning: -1, barat: -1, botak: 0 }],
  ['Upin & Ipin', '👬', 'Malaysia', { pria: 1, indo: -1, nyata: -1, kartun: 1, muda: 1, botak: 1, kembar: 1, barat: -1 }],
  ['Mickey Mouse', '🐭', 'Disney', { pria: 1, indo: -1, nyata: -1, kartun: 1, disney: 1, kuning: -1, barat: 1 }],
  ['Masha', '🐻', 'Masha and the Bear', { pria: -1, indo: -1, nyata: -1, kartun: 1, muda: 1, putri: -1, disney: -1, barat: -1 }],
  ['Elsa', '❄️', 'Frozen', { pria: -1, indo: -1, nyata: -1, kartun: 1, putri: 1, disney: 1, muda: 1, es: 1, barat: 1 }],
  ['Cinderella', '👠', 'Sepatu kaca', { pria: -1, indo: -1, nyata: -1, kartun: 1, putri: 1, disney: 1, muda: 1, es: -1, barat: 1 }],
  ['Iron Man', '🤖', 'Tony Stark', { pria: 1, indo: -1, nyata: -1, superhero: 1, barat: 1, terbang: 1, jubah: -1, jahat: -1 }],
  ['Spiderman', '🕷️', 'Peter Parker', { pria: 1, indo: -1, nyata: -1, superhero: 1, barat: 1, muda: 1, terbang: -1, jubah: -1, jahat: -1 }],
  ['Batman', '🦇', 'Bruce Wayne', { pria: 1, indo: -1, nyata: -1, superhero: 1, barat: 1, jubah: 1, terbang: -1, jahat: -1 }],
  ['Superman', '🦸', 'Krypton', { pria: 1, indo: -1, nyata: -1, superhero: 1, barat: 1, terbang: 1, jubah: 1, jahat: -1 }],
  ['Thor', '🔨', 'Dewa petir', { pria: 1, indo: -1, nyata: -1, superhero: 1, barat: 1, terbang: 1, jubah: 1, palu: 1, jahat: -1 }],
  ['Gatotkaca', '🇮🇩', 'Superhero Indonesia', { pria: 1, indo: 1, nyata: -1, superhero: 1, terbang: 1, jahat: -1 }],
  ['Thanos', '🟣', 'Mad Titan', { pria: 1, indo: -1, nyata: -1, jahat: 1, barat: 1, botak: 1, kartun: -1, anime: -1 }],
  ['Joker', '🃏', 'Badut kriminal', { pria: 1, indo: -1, nyata: -1, jahat: 1, barat: 1, badut: 1, kartun: -1, anime: -1 }]
]
const FIKSI_NEGATIF = ['politik', 'presiden', 'pahlawan', 'militer', 'proklamator', 'ordebaru', 'ulama', 'artis', 'musik', 'dangdut', 'komedi', 'olahraga', 'bola', 'bulu', 'pildun', 'gamer', 'kpop', 'hollywood', 'luarnegeri']
const NYATA_NEGATIF = ['anime', 'kartun', 'superhero', 'jahat', 'putri', 'ninja', 'karet', 'iblis', 'kacamata', 'pedang', 'kuning', 'botak', 'es', 'terbang', 'jubah', 'palu', 'badut', 'disney', 'kembar']
/** @type {{n:string,e:string,d:string,a:Object}[]} */
export const AKIN_CHARS = MENTAH.map(([n, e, d, a]) => {
  const o = { ...a }
  if (o.indo === 1 && o.barat === undefined) o.barat = -1
  if (o.barat === 1 && o.indo === undefined) o.indo = -1
  if (o.nyata === 1) {
    for (const k of [...NYATA_NEGATIF, ...FIKSI_NEGATIF]) if (o[k] === undefined) o[k] = -1
    if (o.meninggal === undefined) o.meninggal = -1 // dianggap hidup kecuali disebut wafat
  }
  if (o.nyata === -1) for (const k of [...FIKSI_NEGATIF, ...NYATA_NEGATIF]) if (o[k] === undefined) o[k] = -1
  return { n, e, d, a: o }
})

/* ------------------------- MESIN ------------------------- */
function skorUrut (s) {
  return AKIN_CHARS
    .map((c, i) => ({ i, v: (s.scores[i] || 0) - (s.elim.includes(i) ? 1e9 : 0) - (s.tebakan.includes(i) ? 1e9 : 0) }))
    .sort((a, b) => b.v - a.v)
}
/* pilih pertanyaan paling memisahkan 16 kandidat teratas (bobot skor: pemimpin lebih penting) */
function pilihQ (s) {
  const top = skorUrut(s).slice(0, 16)
  const minV = Math.min(...top.map(x => x.v))
  let terbaik = -1, nilaiTerbaik = 0
  AKIN_Q.forEach((q, qi) => {
    if (s.asked.includes(qi)) return
    let Wya = 0, Wtidak = 0, Wnetral = 0
    for (const x of top) {
      const w = x.v - minV + 1
      const v = AKIN_CHARS[x.i].a[q.k] || 0
      if (v > 0) Wya += w; else if (v < 0) Wtidak += w; else Wnetral += w
    }
    const nilai = Math.min(Wya, Wtidak) * 2 - Math.abs(Wya - Wtidak) * 0.1 - Wnetral * 0.05
    if (nilai > nilaiTerbaik) { nilaiTerbaik = nilai; terbaik = qi }
  })
  return terbaik
}
function harusTebak (s) {
  if (s.asked.length < MIN_TANYA || s.decisive < 4) return false
  if (s.asked.length >= 16) return true // paksa tebak walau seri
  const t = skorUrut(s)
  return (t[0].v - t[1].v) >= 4 // pemimpin jelas → tebak
}
function tombolJawab () {
  return [
    { text: '✅ Ya', id: `${P}akinator ya` },
    { text: '❌ Tidak', id: `${P}akinator tidak` },
    { text: '🤷 Gak tahu', id: `${P}akinator gatau` },
    { text: '🙂 Mungkin', id: `${P}akinator mungkin` },
    { text: '🙁 Mungkin tidak', id: `${P}akinator mungkintidak` }
  ]
}
function teksTanya (s) {
  const q = AKIN_Q[s.cur]
  return `🧞 *Pertanyaan ${s.asked.length}*\n\n❓ *${q.t}*\n\n_(jawab pakai tombol, \`${P}akinator ya/tidak/gatau/mungkin/mungkintidak\`, atau ketik langsung)_`
}
function gambarJin () {
  try {
    const p = join(__DIR, '..', 'media', 'akinator-jin.jpg')
    return existsSync(p) ? readFileSync(p) : null
  } catch { return null }
}
async function kirimTanya (m, s, kunci) {
  s.expires = Date.now() + TTL
  sesi.set(kunci, s)
  const teks = teksTanya(s)
  try {
    await m.sendButtons({ title: '🧞 AKINATOR', text: teks, footer: `Tebakan ke-${s.tebakan.length + 1} · ${P}akinstop berhenti`, buttons: tombolJawab() })
  } catch { await m.reply(teks) }
}
async function kirimTebakan (m, s, kunci) {
  const g = AKIN_CHARS[s.tebakIdx]
  s.fase = 'tebak'
  s.expires = Date.now() + TTL
  sesi.set(kunci, s)
  const teks = `🔮 *Aku menerawang...*\n\nKamu memikirkan:\n\n${g.e} *${g.n}*\n_${g.d}_\n\n*Apakah aku benar?* 🧞`
  try {
    await m.sendButtons({
      title: '🧞 TEBAKAN JIN', text: teks,
      buttons: [
        { text: '✅ Ya, benar!', id: `${P}akinator benar` },
        { text: '❌ Bukan!', id: `${P}akinator salah` }
      ]
    })
  } catch { await m.reply(teks + `\n\nJawab: \`${P}akinator benar/salah\``) }
}
function mulaiTebakan (s) {
  const t = skorUrut(s).filter(x => x.v > -1e8)
  if (!t.length) return false
  s.tebakIdx = t[0].i
  if (!s.tebakan.includes(t[0].i)) s.tebakan.push(t[0].i)
  return true
}
async function menang (m, s, kunci) {
  sesi.delete(kunci)
  const koin = Math.max(200, 600 - s.asked.length * 25 - (s.tebakan.length - 1) * 100)
  const exp = 60
  const skor = Math.max(100, 1200 - s.asked.length * 50 - (s.tebakan.length - 1) * 200)
  const user = m.senderKey || m.sender
  try { addMoney(user, koin); addExp(user, exp) } catch {}
  try { catatSkor(user, m.pushName || 'Pemain', 'akinator', skor) } catch {}
  const teks = `🎉 *BENAR! Aku memang jin terpintar!* 🧞\n\n${AKIN_CHARS[s.tebakIdx].e} *${AKIN_CHARS[s.tebakIdx].n}* dalam ${s.asked.length} pertanyaan + ${s.tebakan.length} tebakan.\n\n💰 +${koin.toLocaleString('id-ID')} koin\n✨ +${exp} EXP\n🏆 Skor: ${skor}`
  try {
    await m.sendButtons({ title: '🧞 AKINATOR MENANG', text: teks, buttons: [{ text: '🔮 Main Lagi', id: `${P}akinator` }, { text: '🎮 RPG Menu', id: `${P}rpg` }] })
  } catch { await m.reply(teks) }
}
async function kalah (m, s, kunci) {
  sesi.delete(kunci)
  const teks = `😤 *Kamu menang kali ini!* 🧞💨\n\nAku menyerah setelah ${s.asked.length} pertanyaan. Tokohmu terlalu misterius...\n\nTantang aku lagi: \`${P}akinator\``
  try {
    await m.sendButtons({ title: '🧞 JIN MENYERAH', text: teks, buttons: [{ text: '🔮 Tantang Lagi', id: `${P}akinator` }] })
  } catch { await m.reply(teks) }
}
/* terapkan jawaban bernilai val (-1..1). Kembalikan 'tanya'|'tebak'|'menang'|'kalah' */
async function prosesJawaban (m, s, kunci, val) {
  if (s.fase === 'tebak') {
    if (val > 0) { await menang(m, s, kunci); return 'menang' }
    if (val < 0) {
      s.elim.push(s.tebakIdx)
      if (s.tebakan.length >= MAKS_TEBAK) { await kalah(m, s, kunci); return 'kalah' }
      s.fase = 'tanya'
      if (s.asked.length >= MAKS_TANYA) { // sudah maksimal → tebak kandidat berikut
        if (!mulaiTebakan(s)) { await kalah(m, s, kunci); return 'kalah' }
        await kirimTebakan(m, s, kunci); return 'tebak'
      }
      let qi = pilihQ(s)
      if (qi < 0) { // tidak ada pertanyaan berguna → langsung tebak kandidat berikut
        if (!mulaiTebakan(s)) { await kalah(m, s, kunci); return 'kalah' }
        await kirimTebakan(m, s, kunci); return 'tebak'
      }
      s.cur = qi; s.asked.push(qi)
      await kirimTanya(m, s, kunci); return 'tanya'
    }
    await kirimTebakan(m, s, kunci); return 'tebak' // val 0 → tanya ulang
  }
  const q = AKIN_Q[s.cur]
  for (let i = 0; i < AKIN_CHARS.length; i++) {
    const v = AKIN_CHARS[i].a[q.k] || 0
    if (v !== 0 && val !== 0) s.scores[i] = (s.scores[i] || 0) + val * v
  }
  if (val !== 0) s.decisive++
  if (s.asked.length >= MAKS_TANYA) { // kesempatan terakhir: tebak kandidat teratas
    if (!mulaiTebakan(s)) { await kalah(m, s, kunci); return 'kalah' }
    await kirimTebakan(m, s, kunci); return 'tebak'
  }
  if (harusTebak(s)) {
    if (!mulaiTebakan(s)) { await kalah(m, s, kunci); return 'kalah' }
    await kirimTebakan(m, s, kunci); return 'tebak'
  }
  let qi = pilihQ(s)
  if (qi < 0) {
    if (s.asked.length >= MIN_TANYA && s.decisive >= 4) { // cukup info → langsung tebak
      if (!mulaiTebakan(s)) { await kalah(m, s, kunci); return 'kalah' }
      await kirimTebakan(m, s, kunci); return 'tebak'
    }
    qi = AKIN_Q.findIndex((q, i) => !s.asked.includes(i)) // belum cukup → tanya apa saja
    if (qi < 0) {
      if (!mulaiTebakan(s)) { await kalah(m, s, kunci); return 'kalah' }
      await kirimTebakan(m, s, kunci); return 'tebak'
    }
  }
  s.cur = qi; s.asked.push(qi)
  await kirimTanya(m, s, kunci); return 'tanya'
}
function sesiAktif (kunci) {
  const s = sesi.get(kunci)
  if (!s) return null
  if (Date.now() > s.expires) { sesi.delete(kunci); return null }
  return s
}



/* ------------------------- KARTU GAME + KLAIM ------------------------- */
/* kirim kartu game; false bila gagal (lib belum ada / relay gagal) → mode chat */
async function kirimGame (m) {
  try {
    const [{ akinatorHtml }, { sendHtmlApp }] = await Promise.all([import('../lib/akinatorgame.js'), import('../lib/htmlapp.js')])
    await sendHtmlApp(m.sock, m.jid, { title: '🧞 AKINATOR', html: akinatorHtml(brand()) })
    await m.reply(`🧞 *AKINATOR — mainkan di kartu di atas!*\n\nPikirkan 1 tokoh → jawab ±20 pertanyaan → jin menebak (3× kesempatan).\nMenang = dapat *kode klaim* → tukar koin + EXP + skor via \`${P}akinklaim <kode>\`.\n\nKartu tidak bisa dibuka? Main versi chat: \`${P}akinator chat\``)
    return true
  } catch (e) { return false }
}
/* mirror akinCekKode() lib/akinengine.js — JANGAN UBAH SALT/hash sepihak (test paritas) */
const AKIN_SALT = 'J1N-L4MPU-7'
function akinHashCek (s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h
}
export function verifikasiKlaim (kode) {
  const m = /^AKIN-(\d{1,2})X([1-3])-([A-Z2-9]{4})$/.exec(String(kode || '').trim().toUpperCase())
  if (!m) return null
  const asked = parseInt(m[1], 10); const tebakan = parseInt(m[2], 10)
  if (asked < 1 || asked > 20) return null
  let h = akinHashCek(asked + 'x' + tebakan + '|' + AKIN_SALT)
  const alf = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let cek = ''
  for (let i = 0; i < 4; i++) { cek += alf[h % 32]; h = Math.floor(h / 32) }
  if (cek !== m[3]) return null
  return { asked, tebakan }
}
export function hadiahKlaim (asked, tebakan) {
  return { koin: Math.max(200, 600 - asked * 25 - (tebakan - 1) * 100), exp: 60, skor: Math.max(100, 1200 - asked * 50 - (tebakan - 1) * 200) }
}

/* ------------------------- PERINTAH ------------------------- */
const NILAI = {
  ya: 1, y: 1, iya: 1, yoi: 1, yes: 1, betul: 1, bener: 1, benar: 1,
  tidak: -1, tdk: -1, nggak: -1, ngga: -1, enggak: -1, gak: -1, ga: -1, no: -1, bukan: -1, salah: -1,
  gatau: 0, gaktau: 0, idk: 0, skip: 0,
  mungkin: 0.6, maybe: 0.6,
  mungkintidak: -0.6
}
function normalArg (a) {
  return String(a || '').toLowerCase().trim().replace(/\s+/g, '')
}
async function mulaiBaru (m, kunci) {
  const s = { user: kunci, jid: m.jid, asked: [], scores: {}, elim: [], tebakan: [], fase: 'tanya', cur: 0, decisive: 0, expires: Date.now() + TTL }
  const qi = pilihQ(s)
  s.cur = qi < 0 ? 0 : qi
  s.asked.push(s.cur)
  sesi.set(kunci, s)
  const intro = `🧞 *AKINATOR* — Jin Penebak Pikiran\n\nPikirkan satu TOKOH (nyata atau fiksi, siapa saja!). Aku akan menebaknya lewat pertanyaan Ya/Tidak.\n\nJawab JUJUR dengan tombol — atau ketik: *ya / tidak / gatau / mungkin / mungkintidak*.\nBerhenti kapan saja: \`${P}akinstop\``
  const img = gambarJin()
  if (img) { try { await m.sendImage(img, intro); } catch { await m.reply(intro) } } else await m.reply(intro)
  await kirimTanya(m, s, kunci)
}
async function jalankan (m, arg) {
  const kunci = m.senderKey || m.sender
  const a = normalArg(arg)
  if (!a || ['mulai', 'main', 'baru', 'start'].includes(a)) {
    const s = sesiAktif(kunci)
    if (s) { // sesi CHAT berjalan → kirim ulang posisi sekarang
      if (s.fase === 'tebak') return kirimTebakan(m, s, kunci)
      return kirimTanya(m, s, kunci)
    }
    if (await kirimGame(m)) return // kartu game (stateless, tanpa sesi)
    return mulaiBaru(m, kunci) // fallback: mode chat
  }
  if (['chat', 'teks', 'tombol'].includes(a)) {
    const s = sesiAktif(kunci)
    if (s) {
      if (s.fase === 'tebak') return kirimTebakan(m, s, kunci)
      return kirimTanya(m, s, kunci)
    }
    return mulaiBaru(m, kunci)
  }
  if (['stop', 'berhenti', 'batal', 'quit', 'udahan', 'akhiri'].includes(a)) {
    if (!sesiAktif(kunci)) return m.reply('ℹ️ Tidak ada permainan Akinator yang berjalan.')
    sesi.delete(kunci)
    return m.reply('🧞💨 *Permainan dihentikan.* Jin kembali ke dalam lampu...\n\nMain lagi: `' + P + 'akinator`')
  }
  if (['ulang', 'ulangi'].includes(a)) {
    const s = sesiAktif(kunci)
    if (!s) return m.reply(`ℹ️ Tidak ada permainan berjalan. Mulai: \`${P}akinator\``)
    if (s.fase === 'tebak') return kirimTebakan(m, s, kunci)
    return kirimTanya(m, s, kunci)
  }
  if (a in NILAI) {
    const s = sesiAktif(kunci)
    if (!s) return m.reply(`ℹ️ Belum ada permainan. Pikirkan tokoh dulu, lalu mulai: \`${P}akinator\``)
    await prosesJawaban(m, s, kunci, NILAI[a])
    return
  }
  return m.reply(`🧞 *AKINATOR*\n\nMain di kartu: \`${P}akinator\`\nKlaim hadiah menang: \`${P}akinklaim <kode>\`\nMode chat (tombol): \`${P}akinator chat\`\nJawab chat: \`${P}akinator ya/tidak/gatau/mungkin/mungkintidak\`\nBerhenti: \`${P}akinstop\``)
}

export const akinator = {
  command: ['akinator', 'akin', 'jin', 'tebakpikiran', 'pembacapikiran'],
  category: 'Games',
  description: 'Akinator: tebak tokoh di kartu HTML, menang dapat kode klaim koin',
  limit: 0,
  cooldown: 2,
  run: async m => jalankan(m, m.args?.[0])
}

export const akinStop = {
  command: ['akinstop', 'stopakin', 'batalakin'],
  category: 'Games',
  description: 'Hentikan permainan Akinator',
  limit: 0,
  run: async m => jalankan(m, 'stop')
}

export const akinKlaim = {
  command: ['akinklaim', 'klaimakin', 'akincode', 'klaimakinator'],
  category: 'Games',
  description: 'Tukar kode kemenangan Akinator (dari kartu game) jadi koin + EXP + skor',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const kode = String(m.args?.[0] || '').trim().toUpperCase()
    const v = verifikasiKlaim(kode)
    if (!v) return m.reply(`🎁 *KLAIM AKINATOR*\n\nKode tidak valid. Menangkan dulu game di kartu \`${P}akinator\`, salin kode AKIN-..x.-.... yang muncul, lalu:\n\`${P}akinklaim <kode>\``)
    const user = m.senderKey || m.sender
    const u = getUser(user)
    u.klaimAkin = Array.isArray(u.klaimAkin) ? u.klaimAkin : []
    if (u.klaimAkin.includes(kode)) return m.reply('⚠️ Kode ini sudah pernah kamu klaim. Menangkan lagi untuk kode baru!')
    const hari = new Date().toLocaleDateString('en-CA')
    u.klaimAkinHari = u.klaimAkinHari?.tgl === hari ? u.klaimAkinHari : { tgl: hari, jml: 0 }
    if (u.klaimAkinHari.jml >= 3) return m.reply('⏳ Batas klaim harian (3) tercapai. Besok lagi ya!')
    const h = hadiahKlaim(v.asked, v.tebakan)
    u.klaimAkin.push(kode)
    if (u.klaimAkin.length > 30) u.klaimAkin = u.klaimAkin.slice(-30)
    u.klaimAkinHari.jml++
    saveDB('users')
    try { addMoney(user, h.koin); addExp(user, h.exp) } catch {}
    try { catatSkor(user, m.pushName || 'Pemain', 'akinator', h.skor) } catch {}
    return m.reply(`🎉 *KLAIM BERHASIL!* 🧞\n\nKode ${kode} → menang ${v.asked} pertanyaan + ${v.tebakan} tebakan.\n\n💰 +${h.koin.toLocaleString('id-ID')} koin\n✨ +${h.exp} EXP\n🏆 Skor: ${h.skor}\n\nMain lagi: \`${P}akinator\``)
  }
}

/* ------------------- JAWABAN KETIKAN (dipanggil handler) ------------------- */
const TEKS_TANYA = {
  1: ['ya', 'y', 'iya', 'iyaa', 'yoi', 'yes', 'yup', 'betul', 'bener', 'benar', 'iya betul'],
  '-1': ['tidak', 'tdk', 'nggak', 'ngga', 'enggak', 'gak', 'ga', 'no', 't', 'bukan', 'salah', 'nggak lah'],
  0: ['gatau', 'gaktau', 'gak tau', 'nggak tau', 'tidak tahu', 'tidak tau', 'gatau deh', 'idk', 'skip', 'mana kutahu', 'nggak tahu'],
  0.6: ['mungkin', 'maybe', 'mungkin iya', 'kayaknya iya', 'sepertinya ya', 'kayaknya ya'],
  '-0.6': ['mungkin tidak', 'mungkintidak', 'mungkin enggak', 'mungkin nggak', 'kayaknya enggak', 'kayaknya tidak', 'sepertinya tidak']
}
const TEKS_TEBAK_BENAR = ['benar', 'ya', 'iya', 'yoi', 'betul', 'bener', 'yes', 'yup', 'tepat', 'cocok']
const TEKS_TEBAK_SALAH = ['salah', 'tidak', 'bukan', 'nggak', 'gak', 'no', 'keliru']
const TEKS_STOP = ['stop', 'berhenti', 'quit', 'udahan', 'akhiri', 'selesai']
export function checkAkinatorAnswer (m) {
  if (m.isCommand || m.isBot) return null
  const kunci = m.senderKey || m.sender
  const s = sesiAktif(kunci)
  if (!s) return null
  const t = String(m.text || '').toLowerCase().trim().replace(/\s+/g, ' ')
  if (!t || t.length > 24) return null
  if (TEKS_STOP.includes(t)) {
    sesi.delete(kunci)
    return { type: 'hint', text: '🧞💨 *Permainan dihentikan.* Jin kembali ke dalam lampu...' }
  }
  if (['ulang', 'ulangi'].includes(t)) {
    if (s.fase === 'tebak') {
      const g = AKIN_CHARS[s.tebakIdx]
      return { type: 'akin', title: '🧞 TEBAKAN JIN', text: `🔮 Kamu memikirkan:\n\n${g.e} *${g.n}*\n_${g.d}_\n\n*Apakah aku benar?*`, buttons: [{ text: '✅ Ya, benar!', id: `${P}akinator benar` }, { text: '❌ Bukan!', id: `${P}akinator salah` }] }
    }
    return { type: 'akin', title: '🧞 AKINATOR', text: teksTanya(s), buttons: tombolJawab() }
  }
  if (s.fase === 'tebak') {
    if (TEKS_TEBAK_BENAR.includes(t)) return { type: 'akin-cmd', val: 1 }
    if (TEKS_TEBAK_SALAH.includes(t)) return { type: 'akin-cmd', val: -1 }
    return null
  }
  for (const [val, list] of Object.entries(TEKS_TANYA)) {
    if (list.includes(t)) return { type: 'akin-cmd', val: Number(val) }
  }
  return null
}
/* eksekusi hasil checkAkinatorAnswer bertipe akin-cmd (dipanggil handler) */
export async function balasAkin (m, val) {
  const kunci = m.senderKey || m.sender
  const s = sesiAktif(kunci)
  if (!s) return
  await prosesJawaban(m, s, kunci, val)
}

export default { akinator, akinStop, akinKlaim }
