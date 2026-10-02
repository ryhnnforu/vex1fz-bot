/**
 * commands/islami.js — fitur islami (prefix ".")
 *   .quran .shalat .doa .asmaulhusna
 */
const api = require('../lib/api')
const { boxLines } = require('../lib/menu')
const { titleCase, randomInt, truncate } = require('../lib/util')

const commands = [
  {
    name: 'quran',
    aliases: ['quran', 'alquran', 'surah'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Baca Al-Qur\'an per surah/ayat',
    usage: '.quran <surah|nama> [ayat]',
    async run(m, sock, args) {
      if (!args.length) {
        return m.reply(
          boxLines('AL-QURAN', [
            `│ *.quran 1* → QS Al-Fatihah`,
            `│ *.quran 2 250* → QS Al-Baqarah ayat 250`,
            `│ *.quran ikhlas* → cari surah`
          ])
        )
      }
      try {
        let num = parseInt(args[0], 10)
        if (isNaN(num)) {
          const results = await api.quranSearch(args.join(' '))
          if (!results.length) return m.reply('Surah tidak ditemukan. Coba angka surah: *.quran 18*')
          if (args.length === 1 && results.length > 1) {
            return m.reply(
              boxLines('HASIL PENCARIAN', results.map(r => `│ *.quran ${r.number}* → ${r.name} (${r.english})`))
            )
          }
          num = results[0].number
        }
        const from = parseInt(args[1] || '1', 10) || 1
        const s = await api.quranSurah(num, from, 5)
        const ayahLines = s.ayahs.map(a => [`│ *(${a.number})*`, `│ ${a.text}`, `│`]).flat()
        m.reply(
          boxLines('AL-QUR\'AN', [
            `│ *SURAH* : ${s.name}`,
            `│ *ARTI*  : ${s.english} (${s.meaning})`,
            `│ *AYAT*  : ${s.totalAyah}`,
            ``,
            ...ayahLines.slice(0, -1),
            ``,
            `│ Lanjut: *.quran ${num} ${from + 5}*`
          ])
        )
      } catch (e) {
        m.reply(`⚠️ Gagal memuat data: ${e.message}`)
      }
    }
  },
  {
    name: 'shalat',
    aliases: ['jadwalshalat', 'jadwalsholat', 'sholat'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Jadwal sholat kota (Kemenag)',
    usage: '.shalat <kota>',
    async run(m, sock, args) {
      const city = args.join(' ')
      if (!city) return m.reply('Contoh: *.shalat medan*')
      try {
        const j = await api.jadwalSholat(city)
        m.reply(
          boxLines('JADWAL SHOLAT', [
            `│ *KOTA*  : ${titleCase(j.city)}`,
            `│ *TANGGAL*: ${j.date}`,
            ``,
            ...Object.entries(j.times).map(([k, v]) => `│ *${k.toUpperCase().padEnd(7)}*: ${String(v).replace(/ \(.*/, '')}`)
          ])
        )
      } catch (e) {
        m.reply(`⚠️ Gagal memuat jadwal: ${e.message}\nContoh: *.shalat jakarta*`)
      }
    }
  },
  {
    name: 'doa',
    aliases: ['doaharian'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kumpulan doa harian',
    usage: '.doa [nomor]',
    async run(m, sock, args) {
      const n = parseInt(args[0], 10)
      if (n >= 1 && n <= api.DOA.length) {
        const d = api.DOA[n - 1]
        return m.reply(
          boxLines(`DOA ${n}`, [
            `│ *${d.t}*`,
            ``,
            `│ ${d.a}`,
            ``,
            `│ ${d.tr}`,
            `│ "${d.id}"`
          ])
        )
      }
      m.reply(
        boxLines('DOA HARIAN', [
          ...api.DOA.map((d, i) => `│ ${i + 1}. ${d.t}`),
          ``,
          `│ Lihat: *.doa 1*`
        ])
      )
    }
  },
  {
    name: 'asmaulhusna',
    aliases: ['asmaul', 'asma'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Asmaul Husna 99',
    usage: '.asmaulhusna [1-99]',
    async run(m, sock, args) {
      try {
        const n = parseInt(args[0], 10)
        const r = await api.asmaulHusna(n)
        if (r.single) {
          const a = r.single
          return m.reply(
            boxLines('ASMAUL HUSNA', [
              `│ *NO*  : ${a.number}`,
              `│ *ARAB*: ${a.name}`,
              `│ *BACA*: ${a.transliteration}`,
              `│ *ARTI*: ${a.meaning}`
            ])
          )
        }
        // 10 acak
        const picks = []
        const used = new Set()
        while (picks.length < 10) {
          const idx = randomInt(1, 99)
          if (used.has(idx)) continue
          used.add(idx)
          picks.push(r.list[idx - 1])
        }
        m.reply(
          boxLines('ASMAUL HUSNA', [
            ...picks.map(a => `│ *${a.number}.* ${a.name} — ${a.transliteration}`),
            ``,
            `│ Detail: *.asmaulhusna 33*`
          ])
        )
      } catch (e) {
        m.reply(`⚠️ Gagal memuat data: ${e.message}`)
      }
    }
  }
]

module.exports = commands
