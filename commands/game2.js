/**
 * commands/game2.js — GAME +15 (lanjutan game.js)
 *   family100 tebakkata tebakhewan tebakbuah caklontong tebakkalimat
 *   wordle guessnum memory tebakartis tebakkota tebakhuruf tebakfakta
 *   tebakfilm tebaknegara
 *
 * Bank soal dikumpulkan per tipe di QUIZES; jawaban dinormalisasi
 * (huruf kecil, tanpa spasi/bacaan) supaya tidak sensitif format.
 */
const db = require('../lib/db')
const { boxLines } = require('../lib/menu')
const { randomInt, pick, fmt } = require('../lib/util')

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}
function addReward(jid, gold, label) {
  const r = db.getRpg(jid)
  if (r) {
    r.gold += gold
    db.setRpg(jid, r)
    return `\nHadiah: *+${gold} gold* (saldo: ${fmt(r.gold)})`
  }
  return `\n💡 Daftar RPG dulu: *.rpgdaftar <nama>* (untuk dapat gold)`
}

/* ═══ BANK SOAL ═══ */
const QUIZES = {
  tebakkata: [
    ['SEPATU', 'Alas kaki yang dipakai berlari ke sekolah'],
    ['KOMPUTER', 'Mesin untuk menghitung & membuka internet'],
    ['JANUARI', 'Bulan pertama dalam setahun'],
    ['PENSIL', 'Alat tulis yang bisa dikerat'],
    ['SPAGETTI', 'Mie panjang khas Italia'],
    ['KAMERA', 'Benda untuk memfoto pemandangan']
  ],
  tebakhewan: [
    ['GAJAH', 'Punya belalai & gading, pemberat di hutan'],
    ['KUPU', 'Sekulit ulat, sesayap burung, suka di bunga'],
    ['PAUS', 'Mamalia terbesar di lautan'],
    ['KELEDAI', 'Suka berengsek & bawa beban'],
    ['ULAR', 'Reptil tak berkaki, bisa mematuk'],
    ['BURUNG', 'Bisa terapung di langit dengan sayapnya']
  ],
  tebakbuah: [
    ['SEMANGKA', 'Luarnya hijau, dalamnya merah, bijinya hitam'],
    ['PISANG', 'Buah melengkung kuning, monyet suka'],
    ['ANGGUR', 'Bergerombol kecil ungu, bisa jadi minuman'],
    ['MANGGA', 'Manis, wangi, musimnya panas'],
    ['NANAS', 'Berduri tapi manis, topi di kepala'],
    ['LECI', 'Kecil merah, berair, biji mengkilap']
  ],
  caklontong: [
    ['EMPAT', 'Berapa jumlah huruf dalam kata APEL?'],
    ['PETA', 'Punya banyak negara tapi tak punya penduduk'],
    ['JAM', 'Punya jarum tapi tak bisa menusuk'],
    ['AWAN', 'Berjalan di langit tanpa punya kaki — apa?'],
    ['SENDOK', 'Benda di meja makan yang tak pernah kenyang'],
    ['UBAN', 'Kalau sering ketemu, rambut berubah jadi putih']
  ],
  tebakkalimat: [
    ['Hujan turun deras', 'Kata-kata berikut melengkapi: "___ ___ deras di sore hari" (isi 2 kata: hujan turun)→ jawab: HUJANTURUN'],
    ['TIDUR PULAS', 'Setelah lelah, orang melakukan ini sampai pagi → TIDURPULAS'],
    ['MAIN BOLA', 'Kegiatan di lapangan pakai kaki → MAINBOLA'],
    ['NAIK KERETA', 'Transportasi di rel → NAIKKERETA'],
    ['JUALAN KOPI', 'Pedagang minuman panas → JUALANKOPI']
  ],
  tebakartis: [
    ['AGNEZMO', 'Penyanyi wanita Indonesia dengan karier internasional'],
    ['RIANISAR', 'Komedian kacamata yang selalu terlihat di layar'],
    ['CHICOMARCEL', 'Pelawak berkepala plontos di netizen'],
    ['DIDIKEMPOT', 'Singer campursari yang dijuluki Lord'],
    ['MAIAESTIANTY', 'Penyanyi & mantan personel duo beken']
  ],
  tebakkota: [
    ['BANDUNG', 'Kota kembang, Paris van Java'],
    ['SURABAYA', 'Kota pahlawan, ikonnya Suro & Boyo'],
    ['MALANG', 'Kota dingin di Jawa Timur, banyak apel'],
    ['MEDAN', 'Kota terbesar di Sumatra, makanannya kaya'],
    ['MAKASSAR', 'Kota metropolitan Sulawesi Selatan'],
    ['YOGYAKARTA', 'Kota pelajar, ikon Tugu & Malioboro']
  ],
  tebakfakta: [
    ['12', 'Berapa jumlah bulan dalam setahun?'],
    ['7', 'Berapa warna pelangi?'],
    ['206', 'Berapa jumlah tulang manusia dewasa?'],
    ['365', 'Berapa hari dalam setahun biasa?'],
    ['1000', '1 kilometer sama dengan berapa meter?'],
    ['8', 'Berapa jumlah planet di tata surya?']
  ],
  tebakfilm: [
    ['TITANIC', 'Kapal mewah karam di Atlantik Utara, cinta beda kelas'],
    ['FROZEN', 'Pangeran es & saudari penguasa salju'],
    ['AVATAR', 'Manusia berkulit biru di planet Pandora'],
    ['JURASSIC', 'Taman dinosaurus yang berakhir kacau'],
    ['HARRY', 'Anak penyihir rambut kemerahan di sekolah sihir']
  ],
  tebaknegara: [
    ['JEPANG', 'Naga sakura, sakura, & sushi'],
    ['MESIR', 'Piramida & Sungai Nil'],
    ['BRASIL', 'Negara samba & kopi, bendera kuning hijau'],
    ['INDIA', 'Masala, Taj Mahal, Bollywood'],
    ['AUSTRALIA', 'Negara kanguru & akar sebaliknya']
  ],
  tebakhuruf: [] // khusus: kata dirahasiakan
}

function startQuiz(m, type, title, extra = {}) {
  const games = db.load().games
  const bank = QUIZES[type]
  const q = pick(bank)
  games[m.chat] = { type, clue: q[1], ans: q[0], tries: 3, started: Date.now(), by: m.sender, ...extra }
  db.save()
  m.reply(
    `${title}\n\n❓ *${q[1]}*\n\nJawab: *.*${type} <jawaban>*\nSisa percobaan: *3*`
      .replace('*. ' , '.')
  )
}

function answerQuiz(m, type, title, userAns) {
  const games = db.load().games
  const sesi = games[m.chat]
  if (!sesi || sesi.type !== type) {
    startQuiz(m, type, title)
    return
  }
  if (norm(userAns) === norm(sesi.ans)) {
    delete games[m.chat]
    db.save()
    m.reply(`${title} — BENAR ✅\nJawaban: *${sesi.ans}*` + addReward(m.chat, 40, type))
  } else {
    sesi.tries--
    if (sesi.tries <= 0) {
      const a = sesi.ans
      delete games[m.chat]
      db.save()
      m.reply(`❌ Habis percobaan! Jawabannya: *${a}*.\nKetik *.${type}* untuk soal baru.`)
    } else {
      db.save()
      m.reply(`❌ Salah! Sisa percobaan: *${sesi.tries}*.`)
    }
  }
}

function quizCmd(name, title, desc) {
  return {
    name, aliases: [], category: 'game', access: 'user', prefixes: ['.'],
    desc, usage: `.${name} <jawaban> (mulai: .${name})`,
    run: (m, sock, args) => {
      if (!args.length) return startQuiz(m, name, title)
      answerQuiz(m, name, title, args.join(' '))
    }
  }
}

const WORDLE_WORDS = ['CERIA', 'MASAK', 'KUNCI', 'PUISI', 'SEHAT', 'RAMAH', 'TAMAN', 'GALAU', 'JEMUR', 'BAKTI', 'LURUS', 'HIJAU', 'SOPAN', 'GEMUK', 'SAYUR']

const commands = [
  /* ═══ 1. FAMILY100 ═══ */
  {
    name: 'family100', aliases: ['family'], category: 'game', access: 'user', prefixes: ['.'],
    desc: 'Tebak semua jawaban seperti Family 100', usage: '.family100 (mulai) | .family100 <jawaban> | .family100 batal',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      const cmd = (args[0] || '').toLowerCase()

      if (!sesi || sesi.type !== 'family100') {
        const q = pick([
          ['SEBUTKAN BENDA DI DAPUR', ['KOMPOR', 'GELAS', 'PANCI', 'SENDOK', 'KULKAS', 'PIRING']],
          ['SEBUTKAN HAL DI PANTAI', ['OMBak'.toUpperCase(), 'PASIR', 'PERAHU', 'BERENANG', 'ESKRIM', 'IKAN']],
          ['SEBUTKAN PEKERJAAN', ['DOKTER', 'GURU', 'POLISI', 'TUKANG', 'PETANI', 'MASYARAK']],
          ['SEBUTKAN BUAH BERWARNA MERAH', ['APEL', 'SEMANGKA', 'STROBERI', 'MELON', 'JAMBU']]
        ])
        games[m.chat] = { type: 'family100', title: q[0], ansList: q[1], found: [], tries: 6, by: m.sender }
        db.save()
        return m.reply(`👨‍👩‍👧‍👦 *FAMILY 100*\n\n❓ ${q[0]}\nTersisa jawaban: *${q[1].length}*\nJawab: *.family100 <jawaban>* (6 kesempatan; *.family100 batal* untuk nyerah)`)
      }

      if (cmd === 'batal' || cmd === 'nyerah') {
        const left = sesi.ansList.filter(a => !sesi.found.includes(a))
        delete games[m.chat]
        db.save()
        return m.reply(`🏁 Ditutup! Jawaban yang belum ketemu:\n${left.map(a => `• *${a}*`).join('\n')}`)
      }
      if (cmd === 'cek') {
        const masked = sesi.ansList.map(a => sesi.found.includes(a) ? `✅ ${a}` : `❓ ${'_ '.repeat(a.length).trim()}`)
        return m.reply(`👨‍👩‍👧‍👦 *${sesi.title}*\n${masked.join('\n')}\nSisa kesempatan: ${sesi.tries}`)
      }

      const guess = norm(args.join(' '))
      const hit = sesi.ansList.find(a => norm(a) === guess)
      if (!hit) {
        sesi.tries--
        if (sesi.tries <= 0) {
          const left = sesi.ansList.filter(a => !sesi.found.includes(a))
          delete games[m.chat]
          db.save()
          return m.reply(`😵 Kesempatan habis! Sisa jawaban:\n${left.map(a => `• *${a}*`).join('\n')}`)
        }
        db.save()
        return m.reply(`❌ Nggak ada di daftar! Sisa kesempatan: *${sesi.tries}*`)
      }
      if (sesi.found.includes(hit)) return m.reply(`*${hit}* sudah ditemukan tadi.`)
      sesi.found.push(hit)
      const all = sesi.found.length === sesi.ansList.length
      if (all) {
        delete games[m.chat]
        db.save()
        return m.reply(`🎉 *SEMUA JAWABAN KETEMU!*\n${sesi.ansList.map(a => `✅ ${a}`).join('\n')}` + addReward(m.chat, 80, 'family100'))
      }
      db.save()
      m.reply(`✅ *${hit}* masuk daftar! (${sesi.found.length}/${sesi.ansList.length}) — sisa kesempatan ${sesi.tries}\nKetik *.family100 cek* untuk lihat progres.`)
    }
  },

  /* ═══ 2–8. QUIZ TEBAK (runner generik) ═══ */
  quizCmd('tebakkata', '🧠 *TEBAK KATA*', 'Tebak kata dari deskripsi'),
  quizCmd('tebakhewan', '🐾 *TEBAK HEWAN*', 'Tebak hewan dari ciri-cirinya'),
  quizCmd('tebakbuah', '🍉 *TEBAK BUAH*', 'Tebak buah dari deskripsi'),
  quizCmd('caklontong', '💡 *CAK LONTONG*', 'Tebak jawaban logika cak lontong'),
  quizCmd('tebakartis', '🌟 *TEBAK ARTIS*', 'Tebak artis dari petunjuk'),
  quizCmd('tebakkota', '🏙️ *TEBAK KOTA*', 'Tebak kota dari julukan/petunjuk'),
  quizCmd('tebakfakta', '🔬 *TEBAK FAKTA*', 'Tebak fakta/angka kebenaran'),
  quizCmd('tebakfilm', '🎬 *TEBAK FILM*', 'Tebak judul film dari ceritanya'),
  quizCmd('tebaknegara', '🌍 *TEBAK NEGARA*', 'Tebak negara dari petunjuk'),

  /* 9. TEBAK KALIMAT (isi kalimat) */
  {
    name: 'tebakkalimat', category: 'game', access: 'user', prefixes: ['.'],
    desc: 'Lengkapi kalimat tersembunyi', usage: '.tebakkalimat (mulai) | .tebakkalimat <jawaban>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      if (!sesi || sesi.type !== 'tebakkalimat') {
        const q = pick([
          ['HUJAN TURUN', 'Lengkapi: "___ ___ deras saat sore hari" (2 kata)'],
          ['TIDUR PULAS', 'Lengkapi: "Dia kelelahan lalu ___ ___ sampai pagi" (2 kata)'],
          ['NAIK KERETA', 'Lengkapi: "Dari Jakarta ke Bandung kami ___ ___" (2 kata)'],
          ['MINUM OBAT', 'Lengkapi: "Sakit kepala, lalu dia ___ ___" (2 kata)'],
          ['BUKA PINTU', 'Lengkapi: "Ada tamu, ia segera ___ ___ rumah" (2 kata)']
        ])
        games[m.chat] = { type: 'tebakkalimat', ans: q[0], clue: q[1], tries: 4, by: m.sender }
        db.save()
        return m.reply(`✍️ *TEBAK KALIMAT*\n\n❓ ${q[1]}\nJawab: *.tebakkalimat <jawaban>* (4 kesempatan)`)
      }
      const guess = norm(args.join(' '))
      if (!guess) return m.reply('Tulis jawabannya!')
      if (guess === norm(sesi.ans)) {
        delete games[m.chat]
        db.save()
        m.reply(`✅ BENAR! Kalimat lengkap: *${sesi.ans}*` + addReward(m.chat, 50, 'tebakkalimat'))
      } else {
        sesi.tries--
        if (sesi.tries <= 0) {
          const a = sesi.ans
          delete games[m.chat]
          db.save()
          m.reply(`❌ Habis! Jawabannya: *${a}*. Ketik *.tebakkalimat* untuk ulang.`)
        } else { db.save(); m.reply(`❌ Salah! Sisa *${sesi.tries}* kesempatan.`) }
      }
    }
  },

  /* 10. TEBAK HURUF (kata rahasia) */
  {
    name: 'tebakhuruf', category: 'game', access: 'user', prefixes: ['.'],
    desc: 'Kata dirahasiakan — tebak satu huruf tiap kesempatan', usage: '.tebakhuruf (mulai) | .tebakhuruf a',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      if (!sesi || sesi.type !== 'tebakhuruf') {
        const [kata, clue] = pick([
          ['BUNGA', 'Tumbuhan indah di taman yang harum'],
          ['KUCING', 'Karnivora kecil penjaga rumah dari tikus'],
          ['SEPEDA', 'Alat transportasi 2 roda dikayuh kaki'],
          ['MEJA', 'Perabot tempat menaruh barang & belajar'],
          ['HARIMAU', 'Kucing besar belang di hutan']
        ])
        games[m.chat] = {
          type: 'tebakhuruf', ans: kata, clue, used: [], wrong: 0,
          board: kata.split('').map(() => '_'), by: m.sender
        }
        db.save()
        return m.reply(`🔤 *TEBAK HURUF*\n❓ ${clue}\nKata: *${games[m.chat].board.join(' ')}* (${kata.length} huruf)\nTebak: *.tebakhuruf a* — salah 5x = kalah`)
      }
      const g = (args[0] || '').toLowerCase().replace(/[^a-z]/g, '')
      if (!g) return m.reply(`Kata: *${sesi.board.join(' ')}* — tebak 1 huruf: *.tebakhuruf a*`)
      if (g.length > 1) { // tebak penuh
        if (norm(g) === norm(sesi.ans)) {
          delete games[m.chat]
          db.save()
          return m.reply(`✅ KATA BENAR: *${sesi.ans}*` + addReward(m.chat, 45, 'tebakhuruf'))
        }
        sesi.wrong++
      } else {
        if (sesi.used.includes(g)) return m.reply(`Huruf *${g}* sudah dipakai. Kata: *${sesi.board.join(' ')}*`)
        sesi.used.push(g)
        if (sesi.ans.toLowerCase().includes(g)) {
          sesi.ans.split('').forEach((ch, i) => { if (ch.toLowerCase() === g) sesi.board[i] = ch })
          if (sesi.board.every(c => c !== '_')) {
            delete games[m.chat]
            db.save()
            return m.reply(`🎉 Kata terbuka: *${sesi.ans}*` + addReward(m.chat, 45, 'tebakhuruf'))
          }
          db.save()
          return m.reply(`✅ Huruf *${g}* ada!\nKata: *${sesi.board.join(' ')}*\nSalah: ${sesi.wrong}/5`)
        }
        sesi.wrong++
      }
      if (sesi.wrong >= 5) {
        const a = sesi.ans
        delete games[m.chat]
        db.save()
        return m.reply(`💀 Salah 5x! Jawaban: *${a}*.\nKetik *.tebakhuruf* untuk ulang.`)
      }
      db.save()
      m.reply(`❌ Tidak ada huruf *${g.toUpperCase()}*. Kata: *${sesi.board.join(' ')}* — salah ${sesi.wrong}/5`)
    }
  },

  /* 11. WORDLE */
  {
    name: 'wordle', category: 'game', access: 'user', prefixes: ['.'],
    desc: 'Tebak kata 5 huruf (🇬🇧 hijau/kuning/abu)', usage: '.wordle (mulai) | .wordle <kata5>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      if (!sesi || sesi.type !== 'wordle') {
        const w = pick(WORDLE_WORDS.filter(x => x.length === 5))
        games[m.chat] = { type: 'wordle', ans: w, guesses: [], by: m.sender }
        db.save()
        return m.reply(`🟩 *WORDLE* 🟨\nTebak kata *5 huruf* (Inggris).\nKetik: *.wordle CRANE* — 6 percobaan.\n🟢 tepat posisi · 🟡 huruf ada, salah posisi · ⚫ tidak ada`)
      }
      const g = (args[0] || '').toUpperCase()
      if (!/^[A-Z]{5}$/.test(g)) return m.reply('Tulis tepat 5 huruf! Contoh: *.wordle CRANE*')
      if (sesi.guesses.includes(g)) return m.reply('Sudah ditebak tadi.')
      sesi.guesses.push(g)
      const ans = sesi.ans
      const fb = []
      const used = ans.split('')
      for (let i = 0; i < 5; i++) {
        if (g[i] === ans[i]) { fb[i] = '🟩'; used[i] = null } else fb[i] = null
      }
      for (let i = 0; i < 5; i++) {
        if (fb[i]) continue
        const idx = used.indexOf(g[i])
        if (idx >= 0) { fb[i] = '🟨'; used[idx] = null } else fb[i] = '⚫'
      }
      const lines = sesi.guesses.map((gg, i) => {
        const row = []
        const u2 = ans.split('')
        for (let k = 0; k < 5; k++) { if (gg[k] === ans[k]) { row[k] = '🟩'; u2[k] = null } else row[k] = null }
        for (let k = 0; k < 5; k++) {
          if (row[k]) continue
          const ix = u2.indexOf(gg[k])
          if (ix >= 0) { row[k] = '🟨'; u2[ix] = null } else row[k] = '⚫'
        }
        return `${gg} ${row.join('')}`
      })
      if (g === ans) {
        delete games[m.chat]
        db.save()
        return m.reply(`🟩 *WORDLE MENANG dalam ${sesi.guesses.length}/6!*\n${lines.join('\n')}` + addReward(m.chat, 60, 'wordle'))
      }
      if (sesi.guesses.length >= 6) {
        delete games[m.chat]
        db.save()
        return m.reply(`❌ Habis 6 percobaan! Jawabannya: *${ans}*\n${lines.join('\n')}`)
      }
      db.save()
      m.reply(`*WORDLE* (${sesi.guesses.length}/6)\n${lines.join('\n')}`)
    }
  },

  /* 12. GUESSNUM */
  {
    name: 'guessnum', aliases: ['tebaknum'], category: 'game', access: 'user', prefixes: ['.'],
    desc: 'Tebak angka rahasia 1-100 (6 kesempatan)', usage: '.guessnum (mulai) | .guessnum <angka>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      if (!sesi || sesi.type !== 'guessnum') {
        games[m.chat] = { type: 'guessnum', n: randomInt(1, 100), tries: 6, by: m.sender }
        db.save()
        return m.reply(`🔢 *GUESSNUM*\nAku sudah memikirkan angka *1-100*.\nTebak: *.guessnum 42* — 6 kesempatan`)
      }
      const n = parseInt(args[0], 10)
      if (!n || n < 1 || n > 100) return m.reply('Angka 1-100 saja!')
      if (n === sesi.n) {
        const sisa = sesi.tries
        delete games[m.chat]
        db.save()
        return m.reply(`🎯 *BENAR!* Angkanya *${n}* (sisa ${sisa} kesempatan)` + addReward(m.chat, 35, 'guessnum'))
      }
      sesi.tries--
      if (sesi.tries <= 0) {
        const a = sesi.n
        delete games[m.chat]
        db.save()
        return m.reply(`😵 Habis! Angkanya *${a}*. Ketik *.guessnum* untuk main lagi.`)
      }
      db.save()
      m.reply(`${n < sesi.n ? '📈 *LEBIH BESAR!*' : '📉 *LEBIH KECIL!*'} (sisa ${sesi.tries})`)
    }
  },

  /* 13. MEMORY */
  {
    name: 'memory', aliases: ['kartucingkat'], category: 'game', access: 'user', prefixes: ['.'],
    desc: 'Game kartu memory 4 pasang: .memory buka <1-8>', usage: '.memory (mulai) | .memory buka 3',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      const sub = (args[0] || '').toLowerCase()

      if (!sesi || sesi.type !== 'memory') {
        const EM = ['🍎', '🍌', '🍇', '🍓']
        const deck = [...EM, ...EM].map(v => ({ v }))
        for (let i = deck.length - 1; i > 0; i--) {
          const j = randomInt(0, i)
          ;[deck[i], deck[j]] = [deck[j], deck[i]]
        }
        games[m.chat] = { type: 'memory', deck, open: [], matched: [], pairs: 4, by: m.sender }
        db.save()
        return m.reply(
          '🎴 *MEMORY* — 4 pasang kartu tertutup!\n' +
          deck.map((c, i) => `${i + 1}. ${sesiHide(i, games[m.chat])}`).join('  ') +
          '\n\nBuka: *.memory buka 1* lalu *.memory buka 5* — cocokkan pasangan!'
        )
      }

      if (sub === 'lihat' || sub === 'cek') {
        return m.reply(sesi.deck.map((c, i) => `${i + 1}. ${sesi.matched.includes(i) || sesi.open.includes(i) ? c.v : '❓'}`).join('  ') +
          `\nPasangan: ${4 - sesi.pairs}/4`)
      }
      const idx = parseInt(args[1] || args[0], 10) - 1
      if (isNaN(idx) || idx < 0 || idx > 7) return m.reply('Pilih kartu 1-8. Contoh: *.memory buka 3*')
      if (sesi.matched.includes(idx) || sesi.open.includes(idx)) return m.reply('Kartu itu sudah terbuka.')

      sesi.open.push(idx)
      if (sesi.open.length < 2) {
        db.save()
        return m.reply(`${sesi.deck[idx].v} di posisi ${idx + 1}!\nBuka kartu kedua: *.memory buka <1-8>*`)
      }
      const [a, b] = sesi.open
      const boardTxt = sesi.deck.map((c, i) => `${i + 1}. ${sesi.matched.includes(i) || i === a || i === b ? c.v : '❓'}`).join('  ')
      if (sesi.deck[a].v === sesi.deck[b].v) {
        sesi.matched.push(a, b)
        sesi.open = []
        sesi.pairs--
        if (sesi.pairs <= 0) {
          delete games[m.chat]
          db.save()
          return m.reply(`🎉 *MEMORY SELESAI! SEMUA PASANGAN KETEMU!*\n${boardTxt}` + addReward(m.chat, 70, 'memory'))
        }
        db.save()
        return m.reply(`✅ Cocok! ${boardTxt}\nPasangan tersisa: ${sesi.pairs}. Lanjut: *.memory buka <angka>*`)
      }
      db.save()
      const v1 = sesi.deck[a].v, v2 = sesi.deck[b].v
      setTimeout(() => {
        try {
          const g2 = db.load().games[m.chat]
          if (g2 && g2.type === 'memory') {
            g2.open = []
            db.save()
            sock.sendMessage(m.chat, { text: `❌ Tidak cocok (${v1} & ${v2}) — kartu ditutup lagi.\nPapan: *${sesi.deck.map((c, i) => `${i + 1}.${g2.matched.includes(i) ? c.v : '❓'}`).join(' ')}*\nLanjut: *.memory buka <angka>*` })
          }
        } catch (_) {}
      }, 1400)
      m.reply(`❌ ${v1} & ${v2} tidak cocok — tunggu...`)
    }
  }
]

function sesiHide(i, s) {
  return s.matched.includes(i) ? s.deck[i].v : '❓'
}

module.exports = commands
