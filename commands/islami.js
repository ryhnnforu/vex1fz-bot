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
  },

  /* ═══════════ 16 FITUR BARU ═══════════ */

  /* 5. KISAH NABI */
  {
    name: 'kisahnabi',
    aliases: ['kisah', 'nabi'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kisah para nabi (pilih nama/urutan)',
    usage: '.kisahnabi | .kisahnabi musa',
    async run(m, sock, args) {
      const q = (args.join(' ') || '').toLowerCase()
      const found = q ? KISAH.find(k => k.n.toLowerCase().includes(q) || q.includes(k.n.toLowerCase())) : null
      if (found) {
        return m.reply(boxLines(`KISAH NABI ${found.n.toUpperCase()}`, [`│ ${found.k}`]))
      }
      m.reply(
        boxLines('KISAH NABI', [
          ...KISAH.map((k, i) => `│ ${i + 1}. Nabi ${k.n}`),
          ``,
          `│ Baca: *.kisahnabi musa*`
        ])
      )
    }
  },

  /* 6. HADIS */
  {
    name: 'hadis',
    aliases: ['hadits'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kumpulan hadis shahih (pilih topik/nomor)',
    usage: '.hadis | .hadis 5',
    async run(m, sock, args) {
      const n = parseInt(args[0], 10)
      if (n >= 1 && n <= HADIS.length) {
        const h = HADIS[n - 1]
        return m.reply(
          boxLines(`HADIS ${n} — ${h.t}`, [
            ``,
            `│ "${h.h}"`,
            ``,
            `│ Arti: ${h.a}`
          ])
        )
      }
      m.reply(
        boxLines('KUMPULAN HADIS', [
          ...HADIS.map((h, i) => `│ ${i + 1}. ${h.t}`),
          ``,
          `│ Baca: *.hadis 1*`
        ])
      )
    }
  },

  /* 7. DZIKIR */
  {
    name: 'dzikir',
    aliases: ['zikir', 'dzikirpagi'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Dzikir pagi & petang',
    usage: '.dzikir pagi | .dzikir petang',
    async run(m, sock, args) {
      const w = (args[0] || 'pagi').toLowerCase()
      const set = w.includes('petang') || w.includes('sore') ? DZIKIR.petang : DZIKIR.pagi
      const judul = w.includes('petang') || w.includes('sore') ? 'DZIKIR PETANG' : 'DZIKIR PAGI'
      m.reply(
        boxLines(judul, [
          ...set.flatMap((d, i) => [`│ ${i + 1}. ${d.d}`, `│    ${d.a}`, `│`]).slice(0, -1),
          ``,
          `│ Dahsyatnya dzikir pagi/petang 🤲`
        ])
      )
    }
  },

  /* 8. TASBIH */
  {
    name: 'tasbih',
    aliases: ['tasbeeh', 'counter'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tasbih digital — hitungan tersimpan, .tasbih 0 untuk reset',
    usage: '.tasbih (tambah) | .tasbih 33 (set target) | .tasbih 0 (reset)',
    async run(m, sock, args) {
      const db = require('../lib/db')
      const st = db.load().settings
      if (!st.tasbih) st.tasbih = {}
      const sesi = st.tasbih[m.chat] || { count: 0, target: 33 }
      const a = args[0]
      if (a === '0') {
        sesi.count = 0
        st.tasbih[m.chat] = sesi
        db.save()
        return m.reply('🔄 Hitungan tasbih direset.')
      }
      const n = parseInt(a, 10)
      if (n >= 1 && n <= 999) {
        sesi.target = n
        st.tasbih[m.chat] = sesi
        db.save()
        return m.reply(`🎯 Target tasbih diatur ke *${n}*. Ketik *.tasbih* untuk mulai menghitung.`)
      }
      sesi.count++
      st.tasbih[m.chat] = sesi
      db.save()
      const sisa = Math.max(0, sesi.target - sesi.count)
      const capai = sesi.count >= sesi.target
      m.reply(
        boxLines('TASBIH', [
          `│ *COUNT* : ${sesi.count} / ${sesi.target}`,
          `│ ${'◯'.repeat(Math.min(20, sesi.count))}${'◌'.repeat(Math.max(0, Math.min(20, sesi.target - sesi.count)))}`,
          capai ? `│ 🤲 *TARGET TERCAPAI!* Alhamdulillah.` : `│ Sisa: ${sisa} lagi`
        ]) + (capai ? '' : '')
      )
      if (capai) {
        sesi.count = 0
        st.tasbih[m.chat] = sesi
        db.save()
      }
    }
  },

  /* 9. NIAT PUASA */
  {
    name: 'niatpuasa',
    aliases: ['niatpuasa', 'niat'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Niat puasa sunnah (senin kamis, arafah, dst)',
    usage: '.niatpuasa | .niatpuasa arafah',
    async run(m, sock, args) {
      const q = (args.join(' ') || '').toLowerCase()
      const found = NIAT.find(n => n.n.toLowerCase().includes(q)) || null
      if (found) {
        return m.reply(
          boxLines(`NIAT PUASA ${found.n.toUpperCase()}`, [
            ``,
            `│ Niat: "${found.i}"`,
            ``,
            `│ (${found.k})`
          ])
        )
      }
      m.reply(
        boxLines('NIAT PUASA SUNNAH', [
          ...NIAT.map((n, i) => `│ ${i + 1}. ${n.n}`),
          ``,
          `│ Pilih: *.niatpuasa arafah*`
        ])
      )
    }
  },

  /* 10. ZAKAT */
  {
    name: 'zakat',
    aliases: ['zakatmaal', 'hitungzakat'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Hitung zakat fitrah & maal (2.5%)',
    usage: '.zakat 1000000 | .zakat fitrah 4',
    async run(m, sock, args) {
      const a0 = (args[0] || '').toLowerCase()
      if (a0 === 'fitrah') {
        const orang = parseInt(args[1] || '1', 10) || 1
        const kg = orang * 2.5
        return m.reply(
          boxLines('ZAKAT FITRAH', [
            `│ *JIWA*  : ${orang} orang`,
            `│ *BERAS* : ${kg} kg (2,5 kg/orang)`,
            ``,
            `│ Setara ± Rp ${fmtZakat(Math.round(orang * 17500))} (estimasi beras 7rb/kg)`
          ])
        )
      }
      const n = parseInt(a0, 10)
      if (!n || n <= 0) return m.reply('Contoh:\n*.zakat 1000000* → zakat maal 2.5%\n*.zakat fitrah 4* → zakat fitrah 4 orang')
      const z = Math.floor(n * 0.025)
      m.reply(
        boxLines('ZAKAT MAAL (2,5%)', [
          `│ *HARTA* : Rp ${fmtZakat(n)}`,
          `│ *ZAKAT* : Rp ${fmtZakat(z)}`,
          ``,
          `│ Nisab: emas200g ≈ Rp180jt`,
          `│ Harta < nisab belum wajib zakat.`
        ])
      )
    }
  },

  /* 11. ADZAN (next prayer) */
  {
    name: 'adzan',
    aliases: ['waktusholat', 'nextsholat'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Sholat berikutnya di kotamu (adzan dalam X menit)',
    usage: '.adzan medan',
    async run(m, sock, args) {
      const city = args.join(' ') || 'Medan'
      try {
        const j = await api.jadwalSholat(city)
        const now = new Date()
        const nowMin = now.getHours() * 60 + now.getMinutes()
        let next = null
        for (const [k, v] of Object.entries(j.times)) {
          const [hh, mm] = String(v).split(':').map(Number)
          if (hh * 60 + mm > nowMin) { next = { k, v, mins: hh * 60 + mm - nowMin }; break }
        }
        if (!next) next = { k: 'Subuh', v: j.times['Subuh'], mins: 24 * 60 - nowMin + (parseInt(String(j.times['Subuh']).split(':')[0], 10) * 60 + parseInt(String(j.times['Subuh']).split(':')[1], 10) - nowMin) }
        m.reply(
          boxLines('ADZAN BERIKUTNYA', [
            `│ *KOTA*  : ${titleCase(city)}`,
            `│ *SHOLAT*: ${next.k.toUpperCase()} — ${String(next.v).replace(/ \(.*/, '')}`,
            `│ *SENGAT*: ± ${next.mins} menit lagi`,
            ``,
            `│ Jadwal lengkap: *.shalat ${city.toLowerCase()}*`
          ])
        )
      } catch (e) {
        m.reply(`⚠️ Gagal: ${e.message}\nContoh: *.adzan medan*`)
      }
    }
  },

  /* 12. AYAT KURSI */
  {
    name: 'ayatkursi',
    aliases: ['kursi'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Teks Ayat Kursi (QS Al-Baqarah 255)',
    usage: '.ayatkursi',
    async run(m) {
      try {
        const s = await api.quranSurah(2, 255, 1)
        m.reply(
          boxLines('AYAT KURSI', [
            `│ QS Al-Baqarah (2) : 255`,
            ``,
            `│ ${s.ayahs[0].text}`
          ])
        )
      } catch (e) {
        m.reply('⚠️ ' + e.message)
      }
    }
  },

  /* ISLAMI BATCH 2 */

  /* 13. TAHLIL */
  {
    name: 'tahlil',
    aliases: ['tahlilan'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Urutan bacaan tahlil/doa arwah',
    usage: '.tahlil',
    async run(m) {
      m.reply(
        boxLines('URUTAN TAHLIL', [
          `│ 1. Al-Fatihah (dalam hati)`,
          `│ 2. "Innaa a'laa..." (3x)`,
          `│ 3. "Allohumma sholli 'alaa..."`
          ,
          `│    (3x)`,
          `│ 4. "Allaahummaghfirlahu..."`
          ,
          `│    (3x)`,
          `│ 5. "Rabbanaa aatinaa..."`
          ,
          ``,
          `│ Setelah tahlil: doa bebas`
          ,
          `│ untuk arwah yang disebut.`
        ])
      )
    }
  },

  /* 14. DAFTAR SURAH */
  {
    name: 'daftarsurah',
    aliases: ['listsurah', 'surahlist'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Daftar114 surah (nomor + nama + jumlah ayat)',
    usage: '.daftarsurah [1-60|61-114]',
    async run(m, sock, args) {
      try {
        const list = await api.quranList()
        const page = parseInt(args[0], 10) >= 61 ? 2 : 1
        const part = page === 1 ? list.slice(0, 57) : list.slice(57)
        m.reply(
          boxLines(`DAFTAR SURAH (114) — ${page === 1 ? '1-57' : '58-114'}`, [
            ...part.map(s => `│ ${String(s.number).padStart(3)}. ${s.name} (${s.ayah})`),
            ``,
            `│ Baca: *.quran <nomor>*`,
            page === 1 ? `│ Lanjut: *.daftarsurah 61*` : `│ Awal: *.daftarsurah*`
          ])
        )
      } catch (e) {
        m.reply('⚠️ ' + e.message)
      }
    }
  },

  /* 15. CARI QURAN */
  {
    name: 'cariquran',
    aliases: ['findquran', 'cariayat'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Cari ayat Al-Qur\'an berdasarkan kata',
    usage: '.cariquran sabar',
    async run(m, sock, args) {
      const q = args.join(' ')
      if (!q) return m.reply('Tulis kata kuncinya.\nContoh: *.cariquran kesabaran*')
      try {
        const res = await api.quranSearchFull(q)
        if (!res.length) return m.reply(`Tidak ada ayat yang mengandung kata "*${q}*".`)
        m.reply(
          boxLines('HASIL PENCARIAN AYAT', [
            ...res.flatMap(r => [
              `│ *QS ${r.surahName} : ${r.ayah}*`,
              `│ ${truncate(r.text, 160)}`,
              `│`
            ]).slice(0, -1),
            ``,
            `│ Baca full: *.quran ${res[0].surah} ${res[0].ayah}*`
          ])
        )
      } catch (e) {
        m.reply('⚠️ ' + e.message)
      }
    }
  },

  /* 16. RUKUN IMAN & ISLAM */
  {
    name: 'rukuniman',
    aliases: ['rukunislam', 'iman'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Rukun Islam & Rukun Iman',
    usage: '.rukuniman | .rukunislam',
    async run(m) {
      m.reply(
        boxLines('RUKUN ISLAM (6)', [
          `│ 1. Syahadat`,
          `│ 2. Sholat 5 waktu`,
          `│ 3. Zakat`,
          `│ 4. Puasa Ramadhan`,
          `│ 5. Haji (bagi mampu)`,
          ``,
          `│ RUKUN IMAN (6)`,
          `│ 1. Percaya Allah`,
          `│ 2. Malaikat`,
          `│ 3. Kitab-kitab`,
          `│ 4. Rasul-rasul`,
          `│ 5. Hari akhir`,
          `│ 6. Qada & qadar`
        ])
      )
    }
  },

  /* 17. SHOLAWAT */
  {
    name: 'sholawat',
    aliases: ['shalawat'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kumpulan sholawat nabi',
    usage: '.sholawat [nomor]',
    async run(m, sock, args) {
      const list = [
        ["Sholawat Nabi (dasar)", "Allaahumma sholli 'alaa Muhammad."],
        ["Sholawat Tibbi", "Allaahumma sholli 'alaa sayyidinaa Muhammadin thibbil qulubii wa dawaahaa"],
        ["Sholawat Nariyah", "Allaahumma sholli 'alaa sayyidinaa Muhammadin wa alihi, wasallim 'adada nuuri allamhaati"],
        ["Sholawat Munjiyat", "Allaahumma sholli 'alaa sayyidinaa Muhammadin wa baarik wa sallim, wa allihii khaira maa 'alam"]
      ]
      const n = parseInt(args[0], 10)
      if (n >= 1 && n <= list.length) {
        const [t, s] = list[n - 1]
        return m.reply(boxLines(t.toUpperCase(), [``, `│ ${s}`]))
      }
      m.reply(
        boxLines('SHOLAWAT NABI', [
          ...list.map((l, i) => `│ ${i + 1}. ${l[0]}`),
          ``,
          `│ Baca: *.sholawat 1*`
        ])
      )
    }
  },

  /* 18. WUDHU */
  {
    name: 'wudhu',
    aliases: ['wudu', 'tatawudhu'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tata cara wudhu yang benar',
    usage: '.wudhu',
    async run(m) {
      m.reply(
        boxLines('TATA CARA WUDHU', [
          `│ 1. Niat dalam hati`,
          `│ 2. Basmalah`,
          `│ 3. Bilas tangan 3x`,
          `│ 4. Kumur & tiup hidung 3x`,
          `│ 5. Basuh muka 3x`,
          `│ 6. Basuh tangan siku 3x (R→L)`,
          `│ 7. Usap kepala + telinga 1x`,
          `│ 8. Bilas kaki siku 3x`,
          `│ 9. Doa setelah wudhu`,
          ``,
          `│ 🤲 Air pertama yang jatuh itu`,
          `│    penghapus dosa.`
        ])
      )
    }
  },

  /* 19. JADWAL BULANAN */
  {
    name: 'jadwalbulan',
    aliases: ['jadwalmh', 'jadwalapi'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Jadwal sholat satu bulan (Kemenag)',
    usage: '.jadwalbulan medan [bulan1-12]',
    async run(m, sock, args) {
      const num = /^\d+$/.test(args[args.length - 1] || '')
      const city = (num && args.length > 1 ? args.slice(0, -1).join(' ') : args.join(' ')) || 'Medan'
      let bulan = num ? parseInt(args[args.length - 1], 10) : new Date().getMonth() + 1
      if (bulan < 1 || bulan > 12) bulan = new Date().getMonth() + 1
      try {
        const rows = await api.jadwalBulan(city, bulan, new Date().getFullYear())
        const tgl = new Date().getDate()
        const show = (bulan === new Date().getMonth() + 1
          ? rows.slice(Math.max(0, tgl - 1), Math.max(0, tgl - 1) + 14)
          : rows.slice(0, 14))
        m.reply(
          boxLines(`JADWAL SHOLAT — ${titleCase(String(city))} (bulan ${bulan})`, [
            ...show.map(d => `│ ${String(d.date.day).padStart(2, ' ')} ${String(d.date.month).slice(0, 3)}: ${d.subuh} ${d.dzuhur} ${d.ashar} ${d.maghrib} ${d.isya}`),
            ``,
            `│ Urutan: Subuh Dzuhur Ashar Maghrib Isya`,
            `│ (dari hari ini, 14 hari)`
          ])
        )
      } catch (e) {
        m.reply(`⚠️ ${e.message}\nContoh: *.jadwalbulan medan*`)
      }
    }
  },

  /* 20. HIJRIAH */
  {
    name: 'hijriah',
    aliases: ['kalenderhijri', 'tanggalhijri'],
    category: 'islami',
    access: 'user',
    prefixes: ['.'],
    desc: 'Konversi tanggal Masehi → Hijriah',
    usage: '.hijriah | .hijriah 25-12-2026',
    async run(m, sock, args) {
      try {
        let date = null
        if (args[0]) {
          const parts = args[0].split('-')
          if (parts.length === 3) date = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
        const r = await api.hijriah(date)
        m.reply(
          boxLines('KALENDER HIJRIAH', [
            `│ *MASEHI*: ${r.gregorian}`,
            `│ *HIJRIAH*: ${r.hijri}`,
            ``,
            `│ Contoh lain: *.hijriah 25-12-2026*`
          ])
        )
      } catch (e) {
        m.reply('⚠️ ' + e.message)
      }
    }
  }
]

/* ═══════════ DATASET LOKAL ═══════════ */

const KISAH = [
  { n: 'Adam', k: 'Nabi pertama, diciptakan dari tanah lalu diberi ruh. Dia dan Hawa tinggal di surga lalu turun ke bumi karena godaan. Manusia adalah keturunannya.' },
  { n: 'Nuh', k: 'Dakwahnya950 tahun ditolak kaumnya. Atas perintah Allah, bahtera penyelamat dibuat; banjir besar membinasakan orang kafir dan Nuh selamat bersama orang beriman.' },
  { n: 'Ibrahim', k: 'Nabi yang membebaskan diri dari menyembah berhala. Diuji dengan disembelih anaknya (Ismail), lalu Allah ganti dengan domba. Dia pembangun Ka\'bah bersama Ismail.' },
  { n: 'Musa', k: 'Diadopsi Firaun saat bayi. Allah utus ia untuk menyelamatkan Bani Israel dari Firaun; laut terbelah dan Firaun tenggelam. Menerima Taurat di Bukit Sinai.' },
  { n: 'Yusuf', k: 'Dibuang saudara-saudaranya karena cemburu, dijual ke Mesir, difitnah lalu dipenjara. Akhirnya menjadi bendahara Mesir dan memaafkan saudaranya dengan lapang dada.' },
  { n: 'Isa', k: 'Nabi tanpa ayah, diutus ke Bani Israel. Diberi mukjizat menyembuhkan buta/kusta dan menghidupkan orang mati dengan izin Allah. Diangkat ke langit.' },
  { n: 'Muhammad', k: 'Nabi penutup, lahir di Mekah tahun Gajah. Menerima wahyu di Gua Hira, berdakwah13 tahun di Mekah lalu hijrah ke Madinah. Islam menyebar ke seluruh dunia.' },
  { n: 'Yunus', k: 'Menyeru kaumnya lalu meninggalkan mereka karena marah. Ditelan ikan paus, berdoa dari dalam gelap perut ikan, lalu diselamatkan dan kaumnya taat.' },
  { n: 'Daud', k: 'Raja dan nabi yang diberi mukjizat suara merdu membaca Zabur, dan gunung-gunung serta burung ikut bertasbih bersamanya.' },
  { n: 'Sulaiman', k: 'Raja yang mengerti bahasa hewan dan menguasai jin. Membangun Baitul Maqdis dengan bantuan jin, dan memiliki singgasana yang sangat megah.' }
]

const HADIS = [
  { t: 'NIAT AMAL', h: 'Sesungguhnya setiap amal itu tergantung pada niatnya.', a: 'Barangsiapa niatnya untuk dunia, maka dia dapat dunia. Barangsiapa niatnya untuk akhirat, dia dapat akhirat.' },
  { t: 'ISLAM IKHSAS', h: 'Islam dibangun di atas5 pilar: syahadat, zakat, puasa Ramadhan, haji.', a: 'Rukun Islam yang wajib dilaksanakan setiap muslim.' },
  { t: 'SALING MENOLONG', h: 'Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lain.', a: 'Barangsiapa menolong kebaikan, dia akan mendapat pahala.' },
  { t: 'JAGA LIDAH', h: 'Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam.', a: 'Lidah adalah penyebab masalah bila tidak dijaga.' },
  { t: 'SALING MENGASIHI', h: 'Tidak sempurna iman salah satu di antara kalian sehingga ia mencintai saudaranya seperti mencintai dirinya.', a: 'Cintai saudaramu seperti kamu mencintai dirimu.' },
  { t: 'MENuntut ILMU', h: 'Menuntut ilmu itu wajib bagi setiap muslim.', a: 'Ilmu lebih utama daripada ibadah sunnah.' },
  { t: 'SEDekah', h: 'Sedekah tidak mengkurangi harta.', a: 'Allah senantiasa melipatgandakan pahala bagi yang bersedekah.' },
  { t: 'BEBERAPA TENTANG AGAMA', h: 'Agama itu mudah dan tidak memberatkan.', a: 'Jangan membuat agama ini keras dan memberatkan diri sendiri.' },
  { t: 'MARAH', h: 'Orang kuat bukanlah yang pandai menjatuhkan, tetapi orang yang menahan marahnya.', a: 'Sabar dan menahan marah itu lebih kuat.' },
  { t: 'KEBERSIHAN', h: 'Kebersihan itu sebagian dari iman.', a: 'Menjaga kebersihan diri dan lingkungan termasuk iman.' },
  { t: 'JANGAN ZALIM', h: 'Takutlah kamu pada kezaliman, karena kezaliman itu kegelapan pada hari kiamat.', a: 'Zalim kepada manusia adalah dosa besar.' },
  { t: 'DZIKIR', h: 'Perumpamaan orang yang berdzikir kepada Allah dan yang tidak adalah seperti orang hidup dan orang mati.', a: 'Dzikir membuat hati hidup.' },
  { t: 'MENJAGA AMANAH', h: 'Sesungguhnya Allah menyuruh menyampaikan amanat kepada yang berhak menerimanya.', a: 'Amanah itu wajib dipenuhi.' },
  { t: 'SABAR', h: 'Sungguh menakjubkan keadaan orang mukmin itu, seluruhnya urusannya itu baik.', a: 'Kalau senang ia bersyukur, kalau susah ia bersabar.' },
  { t: 'MAAF', h: 'Orang yang paling utama di sisi Allah adalah yang paling baik akhlaknya.', a: 'Memaafkan itu lebih utama.' },
  { t: 'SILATURAHMI', h: 'Barangsiapa yang menyambung tali silaturahmi, Allah akan menyambung (rezekinya) dan hatinya.', a: 'Jaga hubungan dengan keluarga dan tetangga.' },
  { t: 'JUJUR', h: 'Jujur itu menuju kebaikan, dan kebaikan itu menuju surga.', a: 'Kejujuran membawa keberkahan.' },
  { t: 'HUAN TAMU', h: 'Tidak beriman orang yang tidak menyayangi tetangganya yang tidak disukainya.', a: 'Tetangga dekat itu yang paling berhak disayangi.' },
  { t: 'QANA', h: 'Bukan karena banyaknya harta yang membahagiakan.', a: 'Cukuplah manusia itu dengan apa yang telah Allah berikan.' },
  { t: 'HUAN KEPADA ORANG TUA', h: 'Ridha Allah tergantung pada ridha orang tua.', a: 'Bermohonlah ampun kepada Allah dan berbuat baik pada orang tuamu.' }
]

const DZIKIR = {
  pagi: [
    { d: 'سبحان الله وبحمده (100x)', a: 'Subhanallah wa bihamdih — dihapus100 dosa & diangkat derajat.' },
    { d: 'لا إله إلا الله وحده لا شريك له (10x)', a: 'Laa ilaaha illallah wahdahu laa syariika lah — harta pertama di surga.' },
    { d: 'اللهم بك أصبحنا وبك أمسينا (10x)', a: 'Allaahumma bika ashbahna wa bika amsina — pagi ini milik-Mu ya Allah.' },
    { d: 'أعوذ بكلمات الله التامات من شر ما خلق (3x)', a: 'A\'udzu bikalimatillahit-taammaati syarri maa khalaq — perlindungan dari kejahatan.' },
    { d: 'بسم الله الذي لا يضر مع اسمه شيء (3x)', a: 'Bismillahil ladzii laa yadhurru ma\'asmihi syai-un — tidak membahayakan apa pun.' }
  ],
  petang: [
    { d: 'سبحان الله وبحمده (100x)', a: 'Subhanallah wa bihamdih — pahala seperti memerdekakan10 hamba.' },
    { d: 'أستغفر الله وأتوب إليه (100x)', a: 'Astaghfirullah wa atubu ilaih — memohon ampun sebelum maghrib.' },
    { d: 'اللهم بك أمسينا وبك نمسي', a: 'Allaahumma bika amsina wa bika namsii — petang ini milik-Mu.' },
    { d: 'أعوذ بكلمات الله التامات من شر ما خلق (3x)', a: 'Perlindungan dari kejahatan yang diciptakan-Nya.' },
    { d: 'اللهم صل على محمد (100x)', a: 'Allaahumma sholli \'alaa Muhammad — sholawat petang.' }
  ]
}

const NIAT = [
  { n: 'Senin-Kamis', i: 'Nawaitu shauma ghadin an adhaii fardha lillahi ta\'ala', k: 'Puasa sunnah Senin & Kamis' },
  { n: 'Arafah', i: "Nawaitu shauma yaumi 'arofata adhaii lillahi ta'ala", k: 'Puasa sunnah9 Dzulhijjah' },
  { n: 'Nisfu Syaban', i: 'Nawaitu shauma nisfi sya\'ban adhaii lillahi ta\'ala', k: 'Puasa sunnah tengah Syaban' },
  { n: '6 Syawal', i: 'Nawaitu shauma ghadin an adhaii fardha lillahi ta\'ala (6 hari Syawal)', k: 'Puasa sunnah6 hari Syawal' },
  { n: 'Senin', i: 'Nawaitu shauma yauma thalatsi an adhaii lillahi ta\'ala', k: 'Puasa sunnah Senin' },
  { n: 'Putih (Ayyamul Bidh)', i: 'Nawaitu shauma ghadin an adhaii fardha lillahi ta\'ala (13-15 Hijriah)', k: 'Puasa tanggal putih bulan Hijriah' }
]

function fmtZakat(n) { return Number(n).toLocaleString('id-ID') }

module.exports = commands
