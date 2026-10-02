/**
 * commands/game.js — game teks (prefix ".")
 *   .suit .math .tebak .slot
 */
const db = require('../lib/db')
const { boxLines } = require('../lib/menu')
const { randomInt, pick, fmt } = require('../lib/util')

function getRpg(jid) { return db.getRpg(jid) }

function addReward(jid, gold, label) {
  const r = getRpg(jid)
  if (r) {
    r.gold += gold
    db.setRpg(jid, r)
    return `\nHadiah: *+${gold} gold* (saldo: ${fmt(r.gold)})`
  }
  return `\n💡 Daftar RPG dulu: *.rpgdaftar <nama>* (untuk dapat gold)`
}

const commands = [
  /* ═══ SUIT ═══ */
  {
    name: 'suit',
    aliases: ['suit2', 'rps'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Suit batu kertas gunting vs bot',
    usage: '.suit <batu|kertas|gunting>',
    async run(m, sock, args) {
      const picks = ['batu', 'kertas', 'gunting']
      const emo = { batu: '🗿', kertas: '📄', gunting: '✂️' }
      const you = (args[0] || '').toLowerCase()
      if (!picks.includes(you)) {
        return m.reply(
          boxLines('SUIT', [
            `│ Pilih: *.suit batu*`,
            `│        *.suit kertas*`,
            `│        *.suit gunting*`
          ])
        )
      }
      const bot = pick(picks)
      let result = 'SERI 🤝'
      if (you === bot) result = 'SERI 🤝'
      else if (
        (you === 'batu' && bot === 'gunting') ||
        (you === 'kertas' && bot === 'batu') ||
        (you === 'gunting' && bot === 'kertas')
      ) result = 'KAMU MENANG 🎉'
      else result = 'KALAH 😵'

      let reward = ''
      if (result.includes('MENANG')) reward = addReward(m.chat, 15, 'suit')
      else if (result.startsWith('SERI')) reward = addReward(m.chat, 5, 'suit')

      m.reply(
        boxLines('SUIT', [
          `│ *KAMU*  : ${emo[you]} ${you.toUpperCase()}`,
          `│ *BOT*   : ${emo[bot]} ${bot.toUpperCase()}`,
          `│ *HASIL* : ${result}`,
          ``,
          `│ Waktu: ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}`
        ]) + reward
      )
    }
  },

  /* ═══ MATH ═══ */
  {
    name: 'math',
    aliases: ['mtk', 'matematika'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kuis matematika cepat',
    usage: '.math (soal baru) | .math <jawaban>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]

      // jawaban
      if (args.length && /^\d+$/.test(args[0])) {
        if (!sesi || sesi.type !== 'math') return m.reply('Belum ada soal. Ketik *.math* untuk soal baru.')
        const jawab = parseInt(args[0], 10)
        if (jawab === sesi.answer) {
          delete games[m.chat]
          db.save()
          m.reply(
            boxLines('MATH — BENAR ✅', [
              `│ *SOAL*   : ${sesi.q}`,
              `│ *JAWABAN*: ${sesi.answer}`,
              `│ *SKOR*   : +${sesi.diff * 10} poin`
            ]) + addReward(m.chat, sesi.diff * 10, 'math')
          )
        } else {
          sesi.tries = (sesi.tries || 0) + 1
          if (sesi.tries >= 3) {
            const ans = sesi.answer
            delete games[m.chat]
            db.save()
            m.reply(`❌ *SALAH!* Soal ${sesi.q} = *${ans}*\nKetik *.math* untuk soal baru.`)
          } else {
            db.save()
            m.reply(`❌ Salah! (${sesi.tries}/3) Coba lagi: *.math ${jawab === sesi.answer ? '' : '<angka>'}*`)
          }
        }
        return
      }

      // soal baru
      const diff = randomInt(1, 3)
      const ops = diff === 1 ? ['+', '-'] : diff === 2 ? ['+', '-', '×'] : ['+', '-', '×', '÷']
      let a, b, op, answer
      op = pick(ops)
      if (op === '÷') {
        b = randomInt(2, 12)
        answer = randomInt(2, 12)
        a = b * answer
      } else if (op === '×') {
        a = randomInt(2, diff === 3 ? 30 : 12)
        b = randomInt(2, diff === 3 ? 30 : 12)
        answer = a * b
      } else {
        a = randomInt(10, diff === 3 ? 200 : 99)
        b = randomInt(1, diff === 3 ? 120 : 50)
        if (op === '-' && b > a) [a, b] = [b, a]
        answer = op === '+' ? a + b : a - b
      }
      games[m.chat] = { type: 'math', q: `${a} ${op} ${b}`, answer, diff, tries: 0, createdAt: Date.now() }
      db.save()
      m.reply(
        boxLines('MATH — SOAL BARU', [
          `│ *SOAL* : ${a} ${op} ${b} = ?`,
          `│ *LEVEL*: ${['', 'MUDAH', 'SEDANG', 'SULIT'][diff]}`,
          ``,
          `│ Jawab: *.math ${answer > 999 ? '<angka>' : ''}*`,
          `│ (3 kesempatan)`
        ])
      )
    }
  },

  /* ═══ TEBAK ANGKA ═══ */
  {
    name: 'tebak',
    aliases: ['tebakangka'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tebak angka 1-100',
    usage: '.tebak (mulai) | .tebak <angka>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]

      if (args.length && /^\d+$/.test(args[0])) {
        if (!sesi || sesi.type !== 'tebak') return m.reply('Belum mulai. Ketik *.tebak* untuk mulai.')
        const n = parseInt(args[0], 10)
        if (n < 1 || n > 100) return m.reply('Angka 1-100 saja!')
        if (n === sesi.n) {
          const tries = sesi.tries + 1
          delete games[m.chat]
          db.save()
          m.reply(
            boxLines('TEBAK — MENANG 🎯', [
              `│ *ANGKA* : ${sesi.n}`,
              `│ *COBAAN*: ${tries}x`,
              `│ *SKOR*  : ${Math.max(10, 110 - tries * 10)} poin`
            ]) + addReward(m.chat, 50, 'tebak')
          )
        } else {
          sesi.tries++
          if (sesi.tries >= 8) {
            const ans = sesi.n
            delete games[m.chat]
            db.save()
            m.reply(`😵 Habis kesempatan! Angkanya *${ans}*.\nKetik *.tebak* untuk main lagi.`)
          } else {
            db.save()
            m.reply(`${n < sesi.n ? '📈 *LEBIH BESAR!*' : '📉 *LEBIH KECIL!*'} (sisa ${8 - sesi.tries} cobaan)`)
          }
        }
        return
      }

      games[m.chat] = { type: 'tebak', n: randomInt(1, 100), tries: 0, createdAt: Date.now() }
      db.save()
      m.reply(
        boxLines('TEBAK ANGKA', [
          `│ Tebak angka *1 - 100*`,
          `│ 8 kali kesempatan`,
          ``,
          `│ Jawab: *.tebak 50*`
        ])
      )
    }
  },

  /* ═══ SLOT ═══ */
  {
    name: 'slot',
    aliases: ['slots'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Mesin slot 🍒',
    usage: '.slot',
    async run(m) {
      const icons = ['🍒', '🍇', '🍋', '7️⃣', '⭐', '🔔']
      const r1 = pick(icons), r2 = pick(icons), r3 = pick(icons)
      const win = r1 === r2 && r2 === r3
      const jackpot = r1 === '7️⃣' && r2 === '7️⃣' && r3 === '7️⃣'
      const reel = `[ ${r1} | ${r2} | ${r3} ]`
      let reward = ''
      if (jackpot) reward = addReward(m.chat, 200, 'slot')
      else if (win) reward = addReward(m.chat, 60, 'slot')
      else reward = '\nCoba lagi 🍀'
      m.reply(
        boxLines('SLOT', [
          ``,
          `│   ${reel}`,
          ``,
          `│ *HASIL*: ${jackpot ? '🎰 JACKPOT!!!' : win ? '🎉 MENANG!' : '😅 KALAH'}`,
          `│ *BONUS* : ${jackpot ? 200 : win ? 60 : 0} gold`
        ]) + reward
      )
    }
  },

  /* ═══ DADU ═══ */
  {
    name: 'dadu',
    aliases: ['dice', 'roll'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Lempar dadu — tebak ganjil/genap atau angka',
    usage: '.dadu ganjil | .dadu genap | .dadu 7',
    async run(m, sock, args) {
      const a = randomInt(1, 6), b = randomInt(1, 6)
      const total = a + b
      const pilih = (args[0] || '').toLowerCase()
      let win = false
      if (pilih === 'ganjil') win = total % 2 === 1
      else if (pilih === 'genap') win = total % 2 === 0
      else if (/^\d+$/.test(pilih)) win = total === parseInt(pilih, 10)
      const reward = win ? addReward(m.chat, 30, 'dadu') : '\nBelum hoki 😅 Coba lagi!'
      m.reply(
        boxLines('DADU', [
          `│   🎲 ${a} + 🎲 ${b} = *${total}*`,
          `│ *TEBAKAN*: ${pilih || '(tanpa tebak)'}`,
          `│ *HASIL*  : ${win ? '🎉 MENANG!' : pilih ? '😵 KALAH' : '🎲 Murni hoki'}`
        ]) + reward
      )
    }
  },

  /* ═══ GACHA ═══ */
  {
    name: 'gacha',
    aliases: ['pull', 'gachagacha'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Gacha karakter — tarik sampai dapet SSR!',
    usage: '.gacha',
    async run(m) {
      const roll = Math.random()
      const rar = roll < 0.03 ? 'SSR' : roll < 0.12 ? 'SR' : roll < 0.35 ? 'R' : 'N'
      const pool = {
        SSR: ['🐉 Naga Kuno', '👼 Malaikat Emas', '👑 Raja Slot'],
        SR: ['🦊 Rubah Api', '⚔️ Ksatria Bayangan', '🧙 Penyihir Dusk'],
        R: ['🐸 Kodok Sakti', '🏹 Pemanah Hutan', '🗡️ Penyusu'],
        N: ['🪨 Batu Berharga', '🍂 Daun Kering', '🐟 Ikan Asin']
      }
      const item = pick(pool[rar])
      const bonus = { SSR: 150, SR: 60, R: 20, N: 5 }[rar]
      m.reply(
        boxLines(`GACHA — ${rar}`, [
          `│ Dapat: *${item}*`,
          `│ RARITY: *${rar}* ${rar === 'SSR' ? '✨✨✨' : rar === 'SR' ? '✨✨' : rar === 'R' ? '✨' : ''}`
        ]) + addReward(m.chat, bonus, 'gacha')
      )
    }
  },

  /* ═══ KOIN ═══ */
  {
    name: 'koin',
    aliases: ['coin', 'lemparkoin'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Lempar koin — tebak kepala atau ekor',
    usage: '.koin kepala | .koin ekor',
    async run(m, sock, args) {
      const pilih = (args[0] || '').toLowerCase().replace(/[^a-z]/g, '')
      if (!['kepala', 'ekor', 'ka', 'ke'].includes(pilih)) {
        return m.reply('Pilih dulu: *.koin kepala* atau *.koin ekor*')
      }
      const hasil = Math.random() < 0.5 ? 'kepala' : 'ekor'
      const tebak = pilih === 'ka' ? 'kepala' : pilih === 'ke' ? 'ekor' : pilih
      const win = tebak === hasil
      m.reply(
        boxLines('LEMPAR KOIN', [
          `│   ${hasil === 'kepala' ? '🪙' : '🟡'} *${hasil.toUpperCase()}*`,
          `│ *PILIHAN*: ${tebak.toUpperCase()}`,
          `│ *HASIL*  : ${win ? '🎉 BENAR!' : '😵 SALAH'}`
        ]) + (win ? addReward(m.chat, 25, 'koin') : '\nCoba lagi!')
      )
    }
  },

  /* ═══ SUSUN KATA ═══ */
  {
    name: 'susunkata',
    aliases: ['scramble', 'susunka'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Susun huruf acak jadi kata yang benar',
    usage: '.susunkata (soal) | .susunkata <jawaban>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      const kata = (args.join(' ') || '').toLowerCase().replace(/[^a-z]/g, '')
      if (kata && sesi && sesi.type === 'susun') {
        if (kata === sesi.answer) {
          delete games[m.chat]
          db.save()
          m.reply(`✅ *BENAR!* Kata: *${sesi.answer.toUpperCase()}*` + addReward(m.chat, 30, 'susun'))
        } else {
          sesi.tries = (sesi.tries || 0) + 1
          if (sesi.tries >= 3) {
            const ans = sesi.answer
            delete games[m.chat]
            db.save()
            m.reply(`❌ Habis kesempatan! Jawabannya: *${ans.toUpperCase()}*\nKetik *.susunkata* untuk soal baru.`)
          } else {
            db.save()
            m.reply(`❌ Salah! (${sesi.tries}/3) Susun lagi ya.`)
          }
        }
        return
      }
      const words = ['jablay', 'vex1fz', 'botzilla', 'monyet', 'kupu', 'sate', 'kopi', 'jeruk', 'rame', 'anjay', 'gila', 'santuy', 'wibu', 'kucing', 'beruang', 'nasi', 'sayur', 'laut', 'gunung', 'awan']
      const w = pick(words)
      const scramble = w.split('').sort(() => Math.random() - 0.5).join('')
      games[m.chat] = { type: 'susun', answer: w, tries: 0, createdAt: Date.now() }
      db.save()
      m.reply(
        boxLines('SUSUN KATA', [
          `│ Acak: *${scramble.toUpperCase()}*`,
          `│ Huruf: ${w.length} • petunjuk: kata sehari-hari`,
          ``,
          `│ Jawab: *.susunkata ${w[0]}${'•'.repeat(w.length - 1)}*`,
          `│ (3 kesempatan)`
        ])
      )
    }
  },

  /* ═══ TICTACTOE ═══ */
  {
    name: 'ttt',
    aliases: ['tictactoe', 'xo'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tic tac toe (XO) lawan bot — pilih petak 1-9',
    usage: '.ttt (mulai) | .ttt <1-9>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      const show = (b) =>
        `│ ${b[1] || '1'} | ${b[2] || '2'} | ${b[3] || '3'}\n` +
        `│ ―――――――――\n` +
        `│ ${b[4] || '4'} | ${b[5] || '5'} | ${b[6] || '6'}\n` +
        `│ ―――――――――\n` +
        `│ ${b[7] || '7'} | ${b[8] || '8'} | ${b[9] || '9'}`
      const winLine = (b, c) => [[1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 4, 7], [2, 5, 8], [3, 6, 9], [1, 5, 9], [3, 5, 7]].some(l => l.every(i => b[i] === c))
      const kosong = (b) => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(i => !b[i])

      if (!sesi || sesi.type !== 'ttt') {
        const b = {}
        games[m.chat] = { type: 'ttt', board: b, createdAt: Date.now() }
        db.save()
        return m.reply(boxLines('TIC TAC TOE', [`│ Kamu: *X* — Bot: *O*`, ``, show(b), ``, `│ Pilih petak: *.ttt 5*`]))
      }
      const n = parseInt(args[0], 10)
      if (!n || n < 1 || n > 9 || sesi.board[n]) return m.reply('Petak tidak valid/terisi. Contoh: *.ttt 5*\n' + show(sesi.board))
      sesi.board[n] = 'X'
      if (winLine(sesi.board, 'X')) {
        delete games[m.chat]; db.save()
        return m.reply(`🎉 *KAMU MENANG!* Papan:\n${show(sesi.board)}` + addReward(m.chat, 40, 'ttt'))
      }
      // langkah bot: menang → blok → tengah → acak
      const kos = kosong(sesi.board)
      if (!kos.length) { delete games[m.chat]; db.save(); return m.reply(`🤝 SERI! Papan:\n${show(sesi.board)}` + addReward(m.chat, 10, 'ttt')) }
      let move = kos.find(i => { const b = { ...sesi.board, [i]: 'O' }; return winLine(b, 'O') })
      if (!move) move = kos.find(i => { const b = { ...sesi.board, [i]: 'X' }; return winLine(b, 'X') })
      if (!move) move = [5, 1, 3, 7, 9, 2, 4, 6, 8].find(i => !sesi.board[i])
      if (!move) move = pick(kos)
      sesi.board[move] = 'O'
      if (winLine(sesi.board, 'O')) {
        delete games[m.chat]; db.save()
        return m.reply(`😵 *BOT MENANG!* Papan:\n${show(sesi.board)}\nCoba lagi: *.ttt*`)
      }
      const sisa = kosong(sesi.board)
      if (!sisa.length) { delete games[m.chat]; db.save(); return m.reply(`🤝 SERI!\n${show(sesi.board)}`) }
      db.save()
      m.reply(`Giliran kamu (X):\n${show(sesi.board)}\n\nPilih: *.ttt <1-9>*`)
    }
  },

  /* ═══ TEBAK BENDERAA ═══ */
  {
    name: 'tebakbendera',
    aliases: ['bendera', 'flagquiz'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tebak nama negara dari benderanya',
    usage: '.tebakbendera (soal) | .tebakbendera <negara>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      const jwb = (args.join(' ') || '').toLowerCase().trim()
      if (jwb && sesi && sesi.type === 'bendera') {
        if (jwb === sesi.answer || jwb === sesi.answer2) {
          delete games[m.chat]; db.save()
          return m.reply(`✅ *BENAR!* Bendera itu milik *${sesi.title}* 🎌` + addReward(m.chat, 30, 'bendera'))
        }
        sesi.tries = (sesi.tries || 0) + 1
        if (sesi.tries >= 3) {
          const ans = sesi.title
          delete games[m.chat]; db.save()
          return m.reply(`❌ Jawabannya: *${ans}*\nKetik *.tebakbendera* untuk baru.`)
        }
        db.save()
        return m.reply(`❌ Salah! (${sesi.tries}/3) Tebak lagi.`)
      }
      const flags = [
        { f: '🇮🇩', title: 'indonesia', answer: 'indonesia' },
        { f: '🇯🇵', title: 'jepang', answer: 'jepang' },
        { f: '🇰🇷', title: 'korea selatan', answer: 'korea', answer2: 'korea selatan' },
        { f: '🇺🇸', title: 'amerika serikat', answer: 'amerika', answer2: 'amerika serikat' },
        { f: '🇬🇧', title: 'inggris', answer: 'inggris', answer2: 'uk' },
        { f: '🇫🇷', title: 'prancis', answer: 'prancis' },
        { f: '🇩🇪', title: 'jerman', answer: 'jerman' },
        { f: '🇹🇷', title: 'turki', answer: 'turki' },
        { f: '🇦🇷', title: 'argentina', answer: 'argentina' },
        { f: '🇧🇷', title: 'brasil', answer: 'brasil' },
        { f: '🇹🇭', title: 'thailand', answer: 'thailand' },
        { f: '🇲🇾', title: 'malaysia', answer: 'malaysia' },
        { f: '🇸🇬', title: 'singapura', answer: 'singapura', answer2: 'singapore' },
        { f: '🇸🇦', title: 'arab saudi', answer: 'arab saudi', answer2: 'saudi' },
        { f: '🇦🇺', title: 'australia', answer: 'australia' },
        { f: '🇮🇹', title: 'italia', answer: 'italia', answer2: 'italy' }
      ]
      const q = pick(flags)
      games[m.chat] = { type: 'bendera', answer: q.answer, answer2: q.answer2 || '', title: q.title, tries: 0, createdAt: Date.now() }
      db.save()
      m.reply(
        boxLines('TEBAK BENDERA', [
          `│   ${q.f}`,
          ``,
          `│ Negaranya apa?`,
          `│ Jawab: *.tebakbendera <negara>*`,
          `│ (3 kesempatan)`
        ])
      )
    }
  },

  /* ═══ KUIS INDONESIA ═══ */
  {
    name: 'kuisidn',
    aliases: ['kuis', 'trivia'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kuis pengetahuan umum Indonesia',
    usage: '.kuisidn (soal) | .kuisidn <jawaban>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      const jwb = (args.join(' ') || '').toLowerCase().trim()
      if (jwb && sesi && sesi.type === 'kuis') {
        if (jwb === sesi.answer) {
          delete games[m.chat]; db.save()
          return m.reply(`✅ *BENAR!* ${sesi.title}` + addReward(m.chat, 25, 'kuis'))
        }
        sesi.tries = (sesi.tries || 0) + 1
        if (sesi.tries >= 2) {
          const ans = sesi.answer
          delete games[m.chat]; db.save()
          return m.reply(`❌ Jawaban benar: *${ans.toUpperCase()}*\nKetik *.kuisidn* untuk baru.`)
        }
        db.save()
        return m.reply(`❌ Salah! (${sesi.tries}/2) Coba lagi.`)
      }
      const qs = [
        { q: 'Ibu kota Indonesia yang baru (IKN) bernama...', a: 'nusantara', t: 'IKN = Nusantara, di Kalimantan Timur.' },
        { q: 'Hewan nasional Indonesia yang dilambangkan Garuda...', a: 'garuda', t: 'Garuda pancasila — burung elang raksasa.' },
        { q: 'Lagu kebangsaan Indonesia berjudul...', a: 'indonesia raya', t: 'Indonesia Raya, pencipta Wage Rudolf Supratman.' },
        { q: 'Pegunungan tertinggi di Indonesia...', a: 'puncak jaya', t: 'Puncak Jaya, Papua — 4.884 mdpl.' },
        { q: 'Pulau terbesar di Indonesia...', a: 'kalimantan', t: 'Kalimantan (bagian Indonesia besar sekali).' },
        { q: 'Semboyan negara Indonesia...', a: 'bhineka tunggal ika', t: 'Bhinneka Tunggal Ika — berbeda-beda tetapi tetap satu.' },
        { q: 'Makanan khas Padang berkuah santan...', a: 'rendang', t: 'Rendang — pernah jadi makanan terlezat dunia.' },
        { q: 'Tarian tradisional dari Bali...', a: 'tari kecak', t: 'Tari Kecak — dikenal nyanyian cak ratusan orang.' },
        { q: 'Candi Buddha terbesar di dunia ada di...', a: 'borobudur', t: 'Candi Borobudur, Magelang, Jawa Tengah.' },
        { q: 'Olahraga yang dimainkan dengan shuttlecock...', a: 'bulu tangkis', t: 'Bulu tangkis — cabang andalan Indonesia.' }
      ]
      const q = pick(qs)
      games[m.chat] = { type: 'kuis', answer: q.a, title: q.t, tries: 0, createdAt: Date.now() }
      db.save()
      m.reply(
        boxLines('KUIS INDONESIA', [
          `│ *${q.q}*`,
          ``,
          `│ Jawab: *.kuisidn <jawaban>*`,
          `│ (2 kesempatan)`
        ])
      )
    }
  },

  /* ═══ SIAPAKAH AKU ═══ */
  {
    name: 'siapaaku',
    aliases: ['siapakahaku', 'tebakkarakter'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tebak tokoh/karakter dari petunjuknya',
    usage: '.siapaaku (soal) | .siapaaku <jawaban>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      const jwb = (args.join(' ') || '').toLowerCase().trim()
      if (jwb && sesi && sesi.type === 'siapa') {
        if (jwb === sesi.answer || (sesi.answer2 && jwb === sesi.answer2)) {
          delete games[m.chat]; db.save()
          return m.reply(`✅ *BENAR!* Jawabannya: *${sesi.title}* 🎉` + addReward(m.chat, 35, 'siapa'))
        }
        sesi.tries = (sesi.tries || 0) + 1
        if (sesi.tries >= 3) {
          const ans = sesi.title
          delete games[m.chat]; db.save()
          return m.reply(`❌ Jawabannya: *${ans}*\nKetik *.siapaaku* untuk baru.`)
        }
        db.save()
        return m.reply(`❌ Salah! (${sesi.tries}/3) Tebak lagi.`)
      }
      const chars = [
        { c: 'Aku penjual bakso yang selalu menemani kari mati.', a: 'kasino', t: 'Kasino (Warkop DKI)' },
        { c: 'Aku cucu dari kakek yang suka memukul kepala orang.', a: 'asin', t: 'Asin (Si Doel)' },
        { c: 'Aku ninja dari desa tersembunyi yang suka ramen.', a: 'naruto', t: 'Naruto Uzumaki' },
        { c: 'Aku detektif yang selalu pakai mantel dan topi.', a: 'detective conan', t: 'Detective Conan', a2: 'conan' },
        { c: 'Aku monyet penjaga gunung yang punya tongkat emas.', a: 'sun gokong', t: 'Sun Go Kong', a2: 'kera sakti' },
        { c: 'Aku pahlawan botak yang satu pukul musuh mati.', a: 'saitama', t: 'Saitama (One Punch Man)' },
        { c: 'Aku kucing oranye suka makan tanpa bayar.', a: 'doraemon', t: 'Doraemon' },
        { c: 'Aku badut yang selalu bikin orang ketawa di TV.', a: 'sule', t: 'Sule' },
        { c: 'Aku ikon mi yang wajahnya ada di mana-mana.', a: 'mi bakso', t: 'Mi Bakso' }
      ]
      const q = pick(chars)
      games[m.chat] = { type: 'siapa', answer: q.a, answer2: q.a2 || '', title: q.t, tries: 0, createdAt: Date.now() }
      db.save()
      m.reply(
        boxLines('SIAPAKAH AKU', [
          `│ *${q.c}*`,
          ``,
          `│ Jawab: *.siapaaku <nama>*`,
          `│ (3 kesempatan)`
        ])
      )
    }
  },

  /* BATCH 2 DI BAWAH */

  /* ═══ BLACKJACK INSTAN ═══ */
  {
    name: 'blackjack',
    aliases: ['bj', 'kartu21'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Blackjack instan — kumpulkan 21 lawan bandar',
    usage: '.blackjack',
    async run(m) {
      const card = () => Math.min(11, randomInt(1, 13))
      const p1 = card() + card()
      const d1 = card() + card()
      const pBust = p1 > 21
      const dBust = d1 > 21
      let hasil
      if (pBust) hasil = '💥 KALAH (meledak >21)'
      else if (dBust) hasil = '🎉 MENANG (bandar meledak)!'
      else if (p1 === 21) hasil = '🎰 BLACKJACK! MENANG!'
      else if (p1 > d1) hasil = '🎉 MENANG!'
      else if (p1 === d1) hasil = '🤝 SERI'
      else hasil = '😵 KALAH'
      const menang = hasil.includes('MENANG') || (dBust && !pBust)
      m.reply(
        boxLines('BLACKJACK', [
          `│ *KAMU* : ${p1}${pBust ? ' 💥' : ''}`,
          `│ *BANDAR*: ${d1}${dBust ? ' 💥' : ''}`,
          `│ *HASIL*: ${hasil}`
        ]) + (menang ? addReward(m.chat, p1 === 21 ? 70 : 35, 'bj') : '')
      )
    }
  },

  /* ═══ BALAP ═══ */
  {
    name: 'balap',
    aliases: ['race', 'balapan'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Balapan seru — siapa yang sampai duluan?',
    usage: '.balap',
    async run(m) {
      const racers = ['🐭 Tikus', '🐈 Kucing', '🐕 Anjing', '🐇 Kelinci', '🐢 Kura']
      const steps = racers.map(() => 0)
      const log = []
      for (let lap = 0; lap < 6; lap++) {
        const line = racers.map((r, i) => {
          steps[i] += randomInt(0, 4)
          return `${r.split(' ')[0]}${'▮'.repeat(Math.min(10, steps[i]))}`
        })
        log.push(`Putaran ${lap + 1}:`)
        log.push('  ' + line.join(' | '))
      }
      const max = Math.max(...steps)
      const winIdx = steps.indexOf(max)
      m.reply(
        boxLines('BALAP', log.slice(0, 18)) +
        `\n\n🏆 *PEMENANG: ${racers[winIdx]}!*` +
        addReward(m.chat, 30, 'balap')
      )
    }
  },

  /* ═══ OMIKUJI ═══ */
  {
    name: 'omikuji',
    aliases: ['fortune', 'nasib'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tarik nasib ala kuil Jepang (omikuji)',
    usage: '.omikuji',
    async run(m) {
      const forts = [
        ['Daikichi', '大吉', '✨ Keberuntungan BESAR! Hari ini emas banget.'],
        ['Chukichi', '中吉', '🍀 Keberuntungan sedang — jalan terus ya.'],
        ['Shokichi', '小吉', '🌱 Keberuntungan kecil, pelan-pelan pasti sampai.'],
        ['Suekichi', '末吉', '🌧️ Awalnya berat, akhirnya bagus. Sabar.'],
        ['Kyō', '凶', '⚡ Hati-hati hari ini, jangan ambil risiko besar.']
      ]
      const [nama, kanji, arti] = pick(forts)
      const bonus = nama === 'Daikichi' ? 50 : nama === 'Chukichi' ? 30 : nama === 'Kyō' ? 0 : 10
      m.reply(
        boxLines('OMIKUJI', [
          `│   ${kanji} — *${nama}*`,
          ``,
          `│ ${arti}`
        ]) + (bonus ? addReward(m.chat, bonus, 'omikuji') : '')
      )
    }
  },

  /* ═══ ZODIAK ═══ */
  {
    name: 'zodiak',
    aliases: ['zodiac', 'ramalan'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Ramalan zodiak harianmu',
    usage: '.zodiak pisces | .zodiak aries',
    async run(m, sock, args) {
      const z = (args[0] || '').toLowerCase()
      const table = {
        aries: ['♈', 'Aries'], taurus: ['♉', 'Taurus'], gemini: ['♊', 'Gemini'], cancer: ['♋', 'Cancer'],
        leo: ['♌', 'Leo'], virgo: ['♍', 'Virgo'], libra: ['♎', 'Libra'], scorpio: ['♏', 'Scorpio'],
        sagitarius: ['♐', 'Sagitarius'], capricorn: ['♑', 'Capricorn'], aquarius: ['♒', 'Aquarius'], pisces: ['♓', 'Pisces']
      }
      if (!table[z]) return m.reply('Contoh: *.zodiak pisces*\nZodiak: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagitarius, capricorn, aquarius, pisces')
      const [emo, nama] = table[z]
      const ramal = pick([
        'Hari ini energimu tinggi, manfaatkan buat tugas berat.',
        'Seseorang bakal bikin senyum hari ini, siap-siap.',
        'Jangan balas chat emosi dulu, tunggu 5 menit.',
        'Rezeki kecil datang dari arah yang nggak disangka.',
        'Fokus ke satu hal aja hari ini, jangan multitasking.',
        'Kesehatan minta istirahat — jangan begadang.'
      ])
      m.reply(
        boxLines(`ZODIAK ${nama.toUpperCase()}`, [
          `│   ${emo}`,
          ``,
          `│ ${ramal}`,
          ``,
          `│ Warna hoki: ${pick(['merah', 'biru', 'hijau', 'kuning', 'ungu', 'hitam'])}`
        ])
      )
    }
  },

  /* ═══ TAROT ═══ */
  {
    name: 'tarot',
    aliases: ['kartutarot'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tarik 1 kartu tarot & maknanya',
    usage: '.tarot',
    async run(m) {
      const cards = [
        ['The Fool', '🌅 Petualangan baru menanti — berani melangkah!'],
        ['The Magician', '🪄 Kamu punya semua yang dibutuhkan. Percaya diri.'],
        ['The Hermit', '🏔️ Butuh waktu sendiri buat mikir — boleh banget.'],
        ['The Star', '⭐ Harapan lagi terang, usahamu akan membuahkan hasil.'],
        ['The Moon', '🌙 Ada yang belum jelas — jangan buru-buru ambil keputusan.'],
        ['The Sun', '☀️ Keberuntungan! Semua terasa ringan dan cerah.'],
        ['Strength', '🦁 Tenang aja, kamu lebih kuat dari yang kamu kira.'],
        ['Wheel of Fortune', '🎡 Nasib sedang berputar — siap-siap perubahan.'],
        ['The World', '🌍 Selesai! Satu fase bagus telah kamu capai.']
      ]
      const [nama, arti] = pick(cards)
      m.reply(
        boxLines('TAROT', [
          `│ 🎴 *${nama}*`,
          ``,
          `│ ${arti}`
        ])
      )
    }
  },

  /* ═══ KAPITAL ═══ */
  {
    name: 'kapital',
    aliases: ['ibukota', 'capitalquiz'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tebak ibu kota negara',
    usage: '.kapital (soal) | .kapital <jawaban>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      const jwb = (args.join(' ') || '').toLowerCase().trim()
      if (jwb && sesi && sesi.type === 'kapital') {
        if (jwb === sesi.answer) {
          delete games[m.chat]; db.save()
          return m.reply(`✅ *BENAR!* Ibu kota ${sesi.negara} = *${sesi.title.toUpperCase()}*` + addReward(m.chat, 30, 'kapital'))
        }
        sesi.tries = (sesi.tries || 0) + 1
        if (sesi.tries >= 3) {
          delete games[m.chat]; db.save()
          return m.reply(`❌ Jawabannya: *${sesi.title}*\nKetik *.kapital* untuk baru.`)
        }
        db.save()
        return m.reply(`❌ Salah! (${sesi.tries}/3) Coba lagi.`)
      }
      const qs = [
        { n: 'Indonesia', a: 'jakarta' }, { n: 'Malaysia', a: 'kuala lumpur', a2: 'kl' },
        { n: 'Thailand', a: 'bangkok' }, { n: 'Jepang', a: 'tokyo' }, { n: 'Korea Selatan', a: 'seoul' },
        { n: 'China', a: 'beijing' }, { n: 'Australia', a: 'canberra' }, { n: 'Mesir', a: 'kairo' },
        { n: 'Turki', a: 'ankara' }, { n: 'Arab Saudi', a: 'riyadh' }, { n: 'Prancis', a: 'paris' },
        { n: 'Inggris', a: 'london' }, { n: 'Jerman', a: 'berlin' }, { n: 'Italia', a: 'roma' },
        { n: 'Kanada', a: 'ottawa' }, { n: 'Amerika Serikat', a: 'washington dc', a2: 'washington' },
        { n: 'Argentina', a: 'buenos aires' }, { n: 'Brasil', a: 'brasilia' },
        { n: 'Vietnam', a: 'hanoi' }, { n: 'Filipina', a: 'manila' }
      ]
      const q = pick(qs)
      games[m.chat] = { type: 'kapital', answer: q.a, answer2: q.a2 || '', title: q.a, negara: q.n, tries: 0, createdAt: Date.now() }
      db.save()
      m.reply(
        boxLines('TEBAK IBU KOTA', [
          `│ Ibu kota *${q.n}* = ?`,
          ``,
          `│ Jawab: *.kapital <kota>*`,
          `│ (3 kesempatan)`
        ])
      )
    }
  },

  /* ═══ NOMOR HOKI ═══ */
  {
    name: 'nomorhoki',
    aliases: ['hoki', 'lucky'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Nomor hoki kamu hari ini',
    usage: '.nomorhoki',
    async run(m) {
      const n = randomInt(1, 99)
      const vibe = pick([
        'energi positif tinggi — cocok buat mulai hal baru',
        'peluang kejutan datang dari arah tak terduga',
        'jaga mulut, rezeki lancar',
        'hari yang pas buat ngobrol sama orang lama',
        'sedikit berani = banyak untung'
      ])
      const lucky = pick(['merah', 'putih', 'hijau', 'emas', 'biru laut'])
      m.reply(
        boxLines('NOMOR HOKI HARI INI', [
          `│   🍀 *${n}*`,
          ``,
          `│ Vibe: ${vibe}`,
          `│ Warna hoki: ${lucky}`
        ])
      )
    }
  },

  /* ═══ NGETIK (typing race) ═══ */
  {
    name: 'ngetik',
    aliases: ['typing', 'ketikcepat'],
    category: 'game',
    access: 'user',
    prefixes: ['.'],
    desc: 'Balapan ngetik — secepat mungkin salin kalimatnya',
    usage: '.ngetik (mulai) | .ngetik <teks persis>',
    async run(m, sock, args) {
      const games = db.load().games
      const sesi = games[m.chat]
      const teks = args.join(' ')
      if (sesi && sesi.type === 'ngetik') {
        if (!teks) return m.reply(`Ketik kalimat ini:\n\n*"${sesi.text}"*\n\nBalas dengan: *.ngetik ${sesi.text}*`)
        const elapsed = (Date.now() - sesi.start) / 1000
        if (teks.toLowerCase().trim() === sesi.text.toLowerCase()) {
          const wpm = Math.round((sesi.text.split(/\s+/).length / elapsed) * 60)
          delete games[m.chat]
          db.save()
          m.reply(
            boxLines('NGETIK — SELESAI ⌨️', [
              `│ *WAKTU* : ${elapsed.toFixed(2)} detik`,
              `│ *SPEED* : ${wpm} WPM`,
              `│ *AKURASI*: 100% (persis)`
            ]) + addReward(m.chat, Math.min(60, Math.max(15, Math.round(wpm / 2))), 'ngetik')
          )
        } else {
          m.reply(`❌ *BEDA!* Salin persis ya, huruf besar/kecil dan spasi ikut.\n\n*"${sesi.text}"*`)
        }
        return
      }
      const kalimat = pick([
        'kursor berjalan pelan menembus malam yang panjang',
        'bot vex1fz selalu siap membantu kamu kapan saja',
        'mengetik cepat itu seru tapi tetap harus benar',
        'hujan turun pelan di depan jendela kamar',
        'semangat pagi jangan lupa sarapan dulu ya'
      ])
      games[m.chat] = { type: 'ngetik', text: kalimat, start: Date.now(), createdAt: Date.now() }
      db.save()
      m.reply(
        boxLines('BALAP NGETIK', [
          `│ Salin kalimat ini SECEPATNYA:`,
          ``,
          `│ *${kalimat}*`,
          ``,
          `│ Jawab: *.ngetik ${kalimat}*`,
          `│ (dihitung waktu ngetikmu)`
        ])
      )
    }
  }
]

module.exports = commands
