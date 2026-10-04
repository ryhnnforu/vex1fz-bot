/**
 * 🎲 GAMES MENU — tebak kata, asah otak, tebak bendera, tebak angka, suit, family100
 * Sesi game disimpan di memori (per chat), otomatis expire.
 */
import { config } from '../config.js'
import { pickRandom, truncate } from '../lib/functions.js'
import { getRPG, addExp, addMoney } from '../lib/rpg.js'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const __DIR = dirname(fileURLToPath(import.meta.url))

const P = config.display.prefix

/** @type {Map<string, {game:string, answer:string|number, reward:number, exp:number, expires:number, host:string}>} */
import { gameSessions as sessions } from '../lib/gamestore.js'
const SESSION_TTL = 120000 // 2 menit

function setSession (jid, data) {
  sessions.set(jid, { ...data, expires: Date.now() + SESSION_TTL })
}
function getSession (jid) {
  const s = sessions.get(jid)
  if (!s) return null
  if (Date.now() > s.expires) {
    sessions.delete(jid)
    return null
  }
  return s
}
function clearSession (jid) {
  sessions.delete(jid)
}

/* ------------------------- DATA SOAL ------------------------- */
export const TEBAK_KATA = [
  { q: 'Tempat menyimpan uang, bentuknya kecil dan bisa dikunci', a: 'dompet' },
  { q: 'Hewan berkaki empat yang suka tulang dan menggonggong', a: 'anjing' },
  { q: 'Alat untuk menulis di papan tulis, mudah dihapus', a: 'kapur' },
  { q: 'Buah berwarna kuning, panjang, disukai monyet', a: 'pisang' },
  { q: 'Kendaraan roda dua yang dikayuh dengan kaki', a: 'sepeda' },
  { q: 'Tempat orang beribadah umat Islam, ada kubah dan menara', a: 'masjid' },
  { q: 'Alat untuk melihat benda jauh, biasa dipakai pengamat bintang', a: 'teropong' },
  { q: 'Bahan makanan pokok orang Indonesia dari padi', a: 'nasi' },
  { q: 'Pakaian adat Jawa untuk pria, bermotif kotak-kotak', a: 'beskap' },
  { q: 'Alat elektronik pendingin ruangan', a: 'ac' },
  { q: 'Hewan laut bertubuh lunak dengan delapan lengan', a: 'gurita' },
  { q: 'Tempat menabung di bank yang berbunga', a: 'deposito' },
  { q: 'Alat untuk mengukur suhu badan', a: 'termometer' },
  { q: 'Buah berduri, baunya menyengat, dijuluki raja buah', a: 'durian' },
  { q: 'Pekerjaan orang yang mengemudikan pesawat', a: 'pilot' }
]

export const ASAH_OTAK = [
  { q: 'Ibu kota provinsi Jawa Timur?', a: ['surabaya'] },
  { q: 'Planet terdekat dari Matahari?', a: ['merkurius'] },
  { q: 'Berapa jumlah provinsi di Indonesia (2024)?', a: ['38'] },
  { q: 'Nama gunung tertinggi di Indonesia?', a: ['puncak jaya', 'carstensz', 'jaya wijaya'] },
  { q: 'Hewan mamalia yang bisa terbang?', a: ['kelelawar'] },
  { q: 'Penemu bola lampu pijar?', a: ['thomas alva edison', 'edison', 'thomas edison'] },
  { q: 'Mata uang negara Jepang?', a: ['yen'] },
  { q: 'Laut terluas di dunia?', a: ['pasifik', 'samudra pasifik'] },
  { q: 'Nama candi Buddha terbesar di dunia?', a: ['borobudur'] },
  { q: 'Organ tubuh manusia yang memompa darah?', a: ['jantung'] },
  { q: 'Bahasa pemrograman yang dibuat oleh Guido van Rossum?', a: ['python'] },
  { q: 'Negara dengan julukan Negeri Matahari Terbit?', a: ['jepang'] },
  { q: 'Berapa sisi yang dimiliki kubus?', a: ['6', 'enam'] },
  { q: 'Nama samudra di selatan Indonesia?', a: ['hindia', 'samudra hindia'] },
  { q: 'Aplikasi pesan yang dipakai bot ini?', a: ['whatsapp', 'wa'] }
]

export const BENDERA = [
  { flag: '🇮🇩', a: ['indonesia'] }, { flag: '🇲🇾', a: ['malaysia'] },
  { flag: '🇯🇵', a: ['jepang'] }, { flag: '🇰🇷', a: ['korea selatan', 'korea'] },
  { flag: '🇺🇸', a: ['amerika serikat', 'amerika', 'united states'] },
  { flag: '🇬🇧', a: ['inggris', 'britania', 'united kingdom'] },
  { flag: '🇧🇷', a: ['brasil', 'brazil'] }, { flag: '🇩🇪', a: ['jerman'] },
  { flag: '🇫🇷', a: ['prancis', 'perancis'] }, { flag: '🇮🇹', a: ['italia'] },
  { flag: '🇹🇭', a: ['thailand'] }, { flag: '🇻🇳', a: ['vietnam'] },
  { flag: '🇸🇬', a: ['singapura'] }, { flag: '🇦🇺', a: ['australia'] },
  { flag: '🇨🇳', a: ['cina', 'china', 'tiongkok'] }, { flag: '🇮🇳', a: ['india'] },
  { flag: '🇪🇬', a: ['mesir'] }, { flag: '🇸🇦', a: ['arab saudi', 'saudi'] }
]

export const FAMILY100 = [
  { q: 'Sebutkan hal yang biasanya ada di dalam tas sekolah', a: ['buku', 'pensil', 'pulpen', 'penghapus', 'penggaris', 'dompet', 'hp', 'botol minum'] },
  { q: 'Sebutkan makanan yang biasa dimakan saat sarapan', a: ['nasi goreng', 'roti', 'telur', 'bubur', 'sereal', 'pisang', 'susu'] },
  { q: 'Sebutkan hewan yang bisa dipelihara di rumah', a: ['kucing', 'anjing', 'ikan', 'hamster', 'burung', 'kelinci', 'kura-kura'] },
  { q: 'Sebutkan tempat wisata populer di Indonesia', a: ['bali', 'borobudur', 'yogyakarta', 'lombok', 'raja ampat', 'bandung', 'jakarta'] },
  { q: 'Sebutkan aplikasi yang sering dibuka tiap hari', a: ['whatsapp', 'tiktok', 'instagram', 'youtube', 'game', 'browser'] },
  { q: 'Sebutkan pekerjaan yang berhubungan dengan komputer', a: ['programmer', 'desainer', 'data analyst', 'youtuber', 'editor', 'teknisi'] }
]

/* v7.33.0 — data hero Mobile Legends (gambar: media/heroml/<id>.png) */
export const HERO_ML = [
  { id: 'miya', nama: 'Miya', role: 'Marksman', a: ['miya'] },
  { id: 'layla', nama: 'Layla', role: 'Marksman', a: ['layla'] },
  { id: 'alucard', nama: 'Alucard', role: 'Fighter', a: ['alucard', 'alu'] },
  { id: 'tigreal', nama: 'Tigreal', role: 'Tank', a: ['tigreal'] },
  { id: 'franco', nama: 'Franco', role: 'Tank', a: ['franco', 'franco'] },
  { id: 'balmond', nama: 'Balmond', role: 'Fighter', a: ['balmond'] },
  { id: 'saber', nama: 'Saber', role: 'Assassin', a: ['saber'] },
  { id: 'zilong', nama: 'Zilong', role: 'Fighter', a: ['zilong', 'yun zhao', 'yunzhao'] },
  { id: 'fanny', nama: 'Fanny', role: 'Assassin', a: ['fanny'] },
  { id: 'kagura', nama: 'Kagura', role: 'Mage', a: ['kagura'] },
  { id: 'gusion', nama: 'Gusion', role: 'Assassin', a: ['gusion', 'gus'] },
  { id: 'lancelot', nama: 'Lancelot', role: 'Assassin', a: ['lancelot', 'lance'] },
  { id: 'ling', nama: 'Ling', role: 'Assassin', a: ['ling'] },
  { id: 'chou', nama: 'Chou', role: 'Fighter', a: ['chou'] },
  { id: 'hayabusa', nama: 'Hayabusa', role: 'Assassin', a: ['hayabusa', 'haya'] },
  { id: 'lesley', nama: 'Lesley', role: 'Marksman', a: ['lesley'] },
  { id: 'granger', nama: 'Granger', role: 'Marksman', a: ['granger'] },
  { id: 'claude', nama: 'Claude', role: 'Marksman', a: ['claude'] },
  { id: 'esmeralda', nama: 'Esmeralda', role: 'Mage', a: ['esmeralda', 'esme'] },
  { id: 'lunox', nama: 'Lunox', role: 'Mage', a: ['lunox'] },
  { id: 'harith', nama: 'Harith', role: 'Mage', a: ['harith'] },
  { id: 'gatotkaca', nama: 'Gatotkaca', role: 'Tank', a: ['gatotkaca', 'gatot'] },
  { id: 'johnson', nama: 'Johnson', role: 'Tank', a: ['johnson', 'js'] },
  { id: 'estes', nama: 'Estes', role: 'Support', a: ['estes'] }
]
export function heroMlImage (id) {
  try {
    const p = join(__DIR, '..', 'media', 'heroml', `${id}.png`)
    return existsSync(p) ? readFileSync(p) : null
  } catch { return null }
}

/* ------------------------- CEK JAWABAN (dipanggil handler) ------------------------- */
export function checkGameAnswer (m) {
  const s = getSession(m.jid)
  if (!s) return null
  const jawaban = (m.text || '').toLowerCase().trim()

  let benar = false
  if (s.game === 'tebakangka') {
    const n = parseInt(jawaban)
    if (isNaN(n)) return null
    if (n === s.answer) benar = true
    else {
      s.tries = (s.tries || 0) + 1
      const hint = n < s.answer ? '📈 Lebih besar!' : '📉 Lebih kecil!'
      sessions.set(m.jid, { ...s, tries: s.tries })
      return { type: 'hint', text: `${hint}\n\nTebakan ke-${s.tries}. Sisa waktu ${Math.ceil((s.expires - Date.now()) / 1000)}s.` }
    }
  } else {
    const list = Array.isArray(s.answer) ? s.answer : [s.answer]
    benar = list.some(a => jawaban === String(a).toLowerCase().trim() || String(a).toLowerCase().includes(jawaban) && jawaban.length > 2)
  }

  if (!benar) return null // biarkan jadi pesan biasa / AI

  clearSession(m.jid)
  const key = m.senderKey || m.sender
  try {
    addMoney(key, s.reward)
    addExp(key, s.exp)
  } catch {}
  return {
    type: 'win',
    text: `🎉 *BENAR!* @${key.split('@')[0]}\n\nJawaban: *${Array.isArray(s.answer) ? s.answer[0] : s.answer}*\n\n💰 +${s.reward.toLocaleString('id-ID')} koin\n✨ +${s.exp} EXP`,
    mentions: [key],
    buttons: [{ text: '🎲 Main Lagi', id: `${P}${s.game === 'tebakangka' ? 'tebakangka' : s.cmd || 'tebakkata'}` }, { text: '🎮 RPG Menu', id: `${P}rpg` }]
  }
}

/* ------------------------- START GAME ------------------------- */
async function startGame (m, { game, cmd, question, answer, reward, exp, extra = '', image = null }) {
  if (getSession(m.jid)) {
    const s = getSession(m.jid)
    return m.reply(`⏳ Masih ada game *${s.game}* berjalan di chat ini.\nJawab dulu, atau tunggu ${Math.ceil((s.expires - Date.now()) / 1000)} detik sampai expire.`)
  }
  setSession(m.jid, { game, cmd, answer, reward, exp })
  const text = `${question}\n\n${extra}⏱️ Waktu: *${SESSION_TTL / 1000} detik*\n💰 Hadiah: ${reward.toLocaleString('id-ID')} koin + ${exp} EXP\n\nKetik jawabanmu langsung di chat ini!`
  if (image) {
    try { await m.sendImage(image, `🎲 *${game.toUpperCase()}*\n\n${text}`) } catch {}
    return m.sendButtons({
      title: `🎲 ${game.toUpperCase()}`,
      text: 'Siapakah dia? Ketik jawabanmu langsung di chat ini!',
      buttons: [{ text: '🚫 Batalkan', id: `${P}batalgame` }]
    }).catch(() => {})
  }
  return m.sendButtons({
    title: `🎲 ${game.toUpperCase()}`,
    text,
    buttons: [{ text: '🚫 Batalkan', id: `${P}batalgame` }]
  }).catch(() => m.reply(text))
}

export default {
  command: ['tebakkata', 'tebak_kata'],
  category: 'Games',
  description: 'Tebak kata dari petunjuk',
  limit: 0,
  cooldown: 2,
  run: async (m) => {
    const soal = pickRandom(TEBAK_KATA)
    return startGame(m, {
      game: 'tebakkata',
      cmd: 'tebakkata',
      question: `*🔤 TEBAK KATA*\n\n${soal.q}\n\n_Jumlah huruf: ${soal.a.length}_`,
      answer: soal.a,
      reward: 250,
      exp: 30
    })
  }
}

export const asahOtak = {
  command: ['asahotak', 'kuis', 'quiz', 'trivia'],
  category: 'Games',
  description: 'Kuis pengetahuan umum',
  limit: 0,
  cooldown: 2,
  run: async (m) => {
    const soal = pickRandom(ASAH_OTAK)
    return startGame(m, {
      game: 'asahotak',
      cmd: 'asahotak',
      question: `*🧠 ASAH OTAK*\n\n${soal.q}`,
      answer: soal.a,
      reward: 300,
      exp: 40
    })
  }
}

export const tebakBendera = {
  command: ['tebakbendera', 'flag'],
  category: 'Games',
  description: 'Tebak negara dari bendera',
  limit: 0,
  cooldown: 2,
  run: async (m) => {
    const soal = pickRandom(BENDERA)
    return startGame(m, {
      game: 'tebakbendera',
      cmd: 'tebakbendera',
      question: `*🚩 TEBAK BENDERA*\n\n${soal.flag}\n\nNegara apakah ini?`,
      answer: soal.a,
      reward: 250,
      exp: 30
    })
  }
}

export const tebakAngka = {
  command: ['tebakangka', 'guessnumber'],
  category: 'Games',
  description: 'Tebak angka 1-100 dengan petunjuk',
  limit: 0,
  cooldown: 2,
  run: async (m) => {
    const answer = Math.floor(Math.random() * 100) + 1
    return startGame(m, {
      game: 'tebakangka',
      cmd: 'tebakangka',
      question: `*🔢 TEBAK ANGKA*\n\nAku memikirkan sebuah angka antara *1 - 100*.\nTebak dengan mengirim angkanya langsung!`,
      answer,
      reward: 400,
      exp: 50,
      extra: '💡 Aku akan kasih petunjuk "lebih besar" / "lebih kecil".\n\n'
    })
  }
}

export const tebakHeroMl = {
  command: ['tebakheroml', 'tebakml', 'tebakhero', 'mlquiz'],
  category: 'Games',
  description: 'Tebak hero Mobile Legends dari gambarnya',
  limit: 0,
  cooldown: 2,
  run: async (m) => {
    const hero = pickRandom(HERO_ML)
    const img = heroMlImage(hero.id)
    return startGame(m, {
      game: 'tebakheroml',
      cmd: 'tebakheroml',
      question: `*🛡️ TEBAK HERO ML*\n\nSiapakah hero ini?\n\n🎭 Role: *${hero.role}*\n🔤 Nama: ${hero.nama.length} huruf, berawalan *${hero.nama[0]}*`,
      answer: hero.a,
      reward: 400,
      exp: 50,
      image: img
    })
  }
}

export const heroMl = {
  command: ['heroml', 'infohero', 'mlhero'],
  category: 'Games',
  description: 'Info hero Mobile Legends (.heroml <nama>)',
  limit: 0,
  cooldown: 2,
  run: async (m) => {
    const q = (m.q || '').toLowerCase().trim()
    if (!q) {
      return m.reply(`*🛡️ DAFTAR HERO ML (${HERO_ML.length})*\n\n${HERO_ML.map(h => `▸ ${h.nama} (${h.role})`).join('\n')}\n\nLihat info + gambar: \`${P}heroml <nama>\`\nMain tebak hero: \`${P}tebakheroml\``)
    }
    const hero = HERO_ML.find(h => h.nama.toLowerCase() === q || h.a.some(a => a === q)) ||
      HERO_ML.find(h => h.nama.toLowerCase().includes(q) || h.a.some(a => a.includes(q)))
    if (!hero) return m.reply(`❌ Hero *${m.q}* tidak ada di daftar.\nLihat daftar: \`${P}heroml\``)
    const img = heroMlImage(hero.id)
    const teks = `*🛡️ ${hero.nama.toUpperCase()}*\n\n🎭 Role: *${hero.role}*\n🔤 Panggilan lain: ${hero.a.join(', ')}\n\nMain: \`${P}tebakheroml\``
    if (img) { try { await m.sendImage(img, teks); return } catch {} }
    return m.reply(teks)
  }
}

export const family100 = {
  command: ['family100', 'survey'],
  category: 'Games',
  description: 'Jawab survey ala Family 100',
  limit: 0,
  cooldown: 2,
  run: async (m) => {
    const soal = pickRandom(FAMILY100)
    return startGame(m, {
      game: 'family100',
      cmd: 'family100',
      question: `*📊 FAMILY 100*\n\n${soal.q}\n\n_Sebanyak ${soal.a.length} jawaban teratas. Kirim 1 jawaban!_`,
      answer: soal.a,
      reward: 300,
      exp: 35
    })
  }
}

export const batalGame = {
  command: ['batalgame', 'stopgame', 'cancelgame'],
  category: 'Games',
  description: 'Batalkan game yang sedang berjalan',
  limit: 0,
  run: async (m) => {
    const s = getSession(m.jid)
    if (!s) return m.reply('Tidak ada game yang berjalan di chat ini.')
    clearSession(m.jid)
    return m.reply(`🚫 Game *${s.game}* dibatalkan.\nJawabannya tadi: \`${Array.isArray(s.answer) ? s.answer.join(', ') : s.answer}\``)
  }
}

/* ------------------------- SUIT (batu gunting kertas) ------------------------- */
export const suit = {
  command: ['suit', 'rps', 'batuguntingkertas'],
  category: 'Games',
  description: 'Suit batu-gunting-kertas melawan bot',
  limit: 0,
  cooldown: 2,
  run: async (m) => {
    const key = m.senderKey || m.sender
    const map = { batu: '🪨', gunting: '✂️', kertas: '📄', rock: '🪨', paper: '📄', scissors: '✂️' }
    const pilihan = (m.args[0] || '').toLowerCase()

    if (!pilihan || !map[pilihan]) {
      return m.sendButtons({
        title: '✂️ Suit — Batu Gunting Kertas',
        text: `Pilih salah satu!\n\n🪨 *batu* — menghancurkan gunting\n✂️ *gunting* — memotong kertas\n📄 *kertas* — membungkus batu\n\nAtau klik tombol di bawah 👇`,
        buttons: [
          { text: '🪨 Batu', id: `${P}suit batu` },
          { text: '✂️ Gunting', id: `${P}suit gunting` },
          { text: '📄 Kertas', id: `${P}suit kertas` }
        ]
      })
    }

    const bot = pickRandom(['batu', 'gunting', 'kertas'])
    const menang =
      (pilihan === 'batu' && bot === 'gunting') ||
      (pilihan === 'gunting' && bot === 'kertas') ||
      (pilihan === 'kertas' && bot === 'batu')
    const seri = pilihan === bot

    let text = `${map[pilihan]} Kamu: *${pilihan.toUpperCase()}*\n${map[bot]} Bot: *${bot.toUpperCase()}*\n\n`
    if (seri) text += '🤝 *SERI!* Coba lagi.'
    else if (menang) text += '🎉 *KAMU MENANG!*'
    else text += '💀 *BOT MENANG!* Coba lagi ya.'

    if (menang) {
      try {
        addMoney(key, 100)
        addExp(key, 15)
      } catch {}
      text += `\n\n💰 +100 koin\n✨ +15 EXP`
    }

    return m.sendButtons({
      title: '✂️ Hasil Suit',
      text,
      buttons: [{ text: '🔄 Main Lagi', id: `${P}suit` }, { text: '🎮 RPG Menu', id: `${P}rpg` }]
    }).catch(() => m.reply(text))
  }
}

/* ------------------------- GAME MENU ------------------------- */
export const gameMenu = {
  command: ['gamemenu', 'games', 'mingame'],
  category: 'Games',
  description: 'Menu semua mini game',
  limit: 0,
  run: async (m) => {
    const text = `*🎲 MINI GAMES — ${config.bot.name}*\n\nMenangkan koin & EXP yang bisa dipakai di RPG! 🎮\n\n▸ \`${P}tebakkata\` — tebak kata dari petunjuk\n▸ \`${P}asahotak\` — kuis pengetahuan umum\n▸ \`${P}tebakbendera\` — tebak negara dari bendera\n▸ \`${P}tebakangka\` — tebak angka 1-100\n▸ \`${P}family100\` — jawab survey\n▸ \`${P}suit\` — batu gunting kertas\n▸ \`${P}tebakheroml\` — tebak hero ML dari gambar\n▸ \`${P}batalgame\` — batalkan game aktif\n\n💡 Koin & EXP nyambung ke sistem RPG (\`${P}rpg\`)`
    return m.sendList({
      title: '🎲 Mini Games',
      text,
      buttonText: '🎮 Pilih Game',
      sections: [{
        title: 'Klik untuk main',
        rows: [
          { title: '🔤 Tebak Kata', description: 'hadiah 250 koin', id: `${P}tebakkata` },
          { title: '🧠 Asah Otak', description: 'hadiah 300 koin', id: `${P}asahotak` },
          { title: '🚩 Tebak Bendera', description: 'hadiah 250 koin', id: `${P}tebakbendera` },
          { title: '🔢 Tebak Angka', description: 'hadiah 400 koin', id: `${P}tebakangka` },
          { title: '📊 Family 100', description: 'hadiah 300 koin', id: `${P}family100` },
          { title: '✂️ Suit', description: 'batu gunting kertas', id: `${P}suit` },
          { title: '🛡️ Tebak Hero ML', description: 'hadiah 400 koin', id: `${P}tebakheroml` },
          { title: '🎮 Menu RPG', description: 'petualangan lengkap', id: `${P}rpg` }
        ]
      }]
    }).catch(() => m.sendButtons({
      title: '🎲 Mini Games',
      text,
      buttons: [
        { text: '🔤 Tebak Kata', id: `${P}tebakkata` },
        { text: '🧠 Asah Otak', id: `${P}asahotak` },
        { text: '🔢 Tebak Angka', id: `${P}tebakangka` },
        { text: '✂️ Suit', id: `${P}suit` },
        { text: '🎮 RPG', id: `${P}rpg` },
        { text: '🏠 Menu', id: 'act:menu:main' }
      ]
    }))
  }
}

/* ================= GAME TAMBAHAN ================= */
const EMOJI_Q = [
  ['🍎', 'apel'], ['🐘', 'gajah'], ['🚗', 'mobil'], ['⚽', 'bola'], ['🌙', 'bulan'],
  ['🔥', 'api'], ['🐟', 'ikan'], ['🏠', 'rumah'], ['✈️', 'pesawat'], ['🌋', 'gunung'],
  ['🐢', 'kura-kura'], ['🎸', 'gitar'], ['', 'jam'], ['', 'kunci'], ['', 'bunga']
]
const HEWAN_Q = [
  ['Besar, punya belalai panjang', 'gajah'],
  ['Lehernya paling panjang sedunia', 'jerapah'],
  ['Raja hutan, suaranya mengaum', 'singa'],
  ['Terbang malam hari, matanya tajam', 'burung hantu'],
  ['Bersisik, hidup di air, bernapas dengan insang', 'ikan'],
  ['Hewan setia penjaga rumah', 'anjing'],
  ['Bisa mengubah warna kulitnya', 'bunglon']
]
const PROFESI_Q = [
  ['Bertugas memadamkan kebakaran', 'pemadam kebakaran'],
  ['Mengajar murid di sekolah', 'guru'],
  ['Merawat orang sakit di rumah sakit', 'perawat'],
  ['Menerbangkan pesawat', 'pilot'],
  ['Memasak makanan di restoran', 'koki'],
  ['Menjaga keamanan negara', 'polisi']
]

export const mathQuiz = {
  command: ['tebakmatematika', 'mathquiz', 'kuisMat', 'matematika'],
  category: 'Games',
  description: 'Kuis hitung cepat (penjumlahan/pengurangan/perkalian)',
  limit: 0,
  run: async (m) => {
    const a = Math.floor(Math.random() * 12) + 1
    const b = Math.floor(Math.random() * 12) + 1
    const ops = ['+', '-', '×']
    const op = pickRandom(ops)
    const ans = op === '+' ? a + b : op === '-' ? a - b : a * b
    return startGame(m, {
      game: 'matematika',
      cmd: m.command,
      question: `➗ *KUIS MATEMATIKA*\n\nBerapa hasil dari:\n*${a} ${op} ${b} = ?*`,
      answer: ans,
      reward: 300,
      exp: 25
    })
  }
}

export const emojiQuiz = {
  command: ['tebakemoji', 'emoji', 'tebakgambarEmoji'],
  category: 'Games',
  description: 'Tebak kata dari emoji',
  limit: 0,
  run: async (m) => {
    const [e, a] = pickRandom(EMOJI_Q)
    return startGame(m, {
      game: 'emoji',
      cmd: m.command,
      question: `😀 *TEBAK EMOJI*\n\nEmoji ini menggambarkan apa?\n\n   ${e}   `,
      answer: a,
      reward: 250,
      exp: 20
    })
  }
}

export const animalQuiz = {
  command: ['tebahewan', 'hewan', 'tebakbinatang'],
  category: 'Games',
  description: 'Tebak hewan dari ciri-cirinya',
  limit: 0,
  run: async (m) => {
    const [c, a] = pickRandom(HEWAN_Q)
    return startGame(m, {
      game: 'hewan',
      cmd: m.command,
      question: `🐾 *TEBAK HEWAN*\n\nCiri-ciri:\n_${c}_`,
      answer: a,
      reward: 250,
      exp: 20
    })
  }
}

export const profesiQuiz = {
  command: ['tebakprofesi', 'profesi', 'tebakpekerjaan'],
  category: 'Games',
  description: 'Tebak profesi dari deskripsi',
  limit: 0,
  run: async (m) => {
    const [c, a] = pickRandom(PROFESI_Q)
    return startGame(m, {
      game: 'profesi',
      cmd: m.command,
      question: `💼 *TEBAK PROFESI*\n\nDeskripsi:\n_${c}_`,
      answer: a,
      reward: 250,
      exp: 20
    })
  }
}

/* ================= TIC TAC TOE vs BOT ================= */
const tttState = new Map()
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]

function tttWinner (b) {
  for (const [x, y, z] of LINES) if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x]
  return b.every(c => c) ? 'draw' : null
}
function tttRender (b) {
  const sym = c => c === 'X' ? '❌' : c === 'O' ? '⭕' : '⬜'
  let out = ''
  for (let r = 0; r < 3; r++) out += b.slice(r * 3, r * 3 + 3).map((c, i) => `${sym(c)}${r * 3 + i + 1}`).join(' ') + '\n'
  return out
}
function tttBotMove (b) {
  const empty = b.map((c, i) => c ? -1 : i).filter(i => i >= 0)
  if (!empty.length) return -1
  const tryWin = (mark) => { for (const i of empty) { const t = [...b]; t[i] = mark; if (tttWinner(t) === mark) return i } return -1 }
  let mv = tryWin('O'); if (mv >= 0) return mv
  mv = tryWin('X'); if (mv >= 0) return mv
  if (b[4] === '') return 4
  const corners = [0, 2, 6, 8].filter(i => b[i] === '')
  if (corners.length) return pickRandom(corners)
  return pickRandom(empty)
}

export const ticTacToe = {
  command: ['tictactoe', 'ttt', 'xo'],
  category: 'Games',
  description: 'Tic-tac-toe lawan bot (kirim .ttt 1-9 untuk main)',
  limit: 0,
  run: async (m) => {
    const arg = String(m.args[0] || '').trim()
    let st = tttState.get(m.jid)

    if (!arg || arg.toLowerCase() === 'start') {
      st = { b: Array(9).fill(''), turn: 'X' }
      tttState.set(m.jid, st)
      return m.sendButtons({
        title: '❌⭕ Tic-Tac-Toe',
        text: `*TIC-TAC-TOE vs BOT*\nKamu = ❌ (X), Bot = ⭕ (O)\n\n${tttRender(st.b)}\nGiliranmu! Pilih kotak 1-9:`,
        buttons: [1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, 9).map(n => ({ text: String(n), id: `${P}ttt ${n}` }))
      }).catch(() => m.reply(`Ketik \`${P}ttt <1-9>\` untuk main.`))
    }

    const idx = parseInt(arg) - 1
    if (isNaN(idx) || idx < 0 || idx > 8) return m.reply(`Ketik \`${P}ttt\` untuk mulai, lalu \`${P}ttt <1-9>\` untuk pilih kotak.`)
    if (!st) return m.reply(`Belum ada permainan. Ketik \`${P}ttt\` dulu untuk mulai.`)
    if (st.b[idx]) return m.reply('Kotak itu sudah terisi! Pilih yang lain.')

    st.b[idx] = 'X'
    let win = tttWinner(st.b)
    if (!win) {
      const bm = tttBotMove(st.b)
      if (bm >= 0) st.b[bm] = 'O'
      win = tttWinner(st.b)
    }

    if (win) {
      tttState.delete(m.jid)
      const msg = win === 'draw' ? '🤝 *SERI!*' : win === 'X' ? '🎉 *KAMU MENANG!*' : '🤖 *BOT MENANG!*'
      if (win === 'X') { try { addMoney(m.senderKey || m.sender, 500); addExp(m.senderKey || m.sender, 40) } catch {} }
      return m.reply(`${tttRender(st.b)}\n${msg}${win === 'X' ? '\n💰 +500 koin, ✨ +40 EXP' : ''}\n\nKetik \`${P}ttt\` untuk main lagi.`)
    }

    return m.sendButtons({
      title: '❌⭕ Tic-Tac-Toe',
      text: `${tttRender(st.b)}\nGiliranmu lagi! Pilih kotak:`,
      buttons: st.b.map((c, i) => c ? null : { text: String(i + 1), id: `${P}ttt ${i + 1}` }).filter(Boolean)
    }).catch(() => m.reply(tttRender(st.b) + `\nGiliranmu: \`${P}ttt <nomor>\``))
  }
}
