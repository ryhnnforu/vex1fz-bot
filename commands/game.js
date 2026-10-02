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
  }
]

module.exports = commands
