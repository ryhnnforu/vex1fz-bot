/**
 * commands/ai.js — MENUSTICKER AI (20 fitur)
 *   .ai .aireset .aigambar .aistiker .aihtml .aikode
 *   .ringkas .terjemah .resep .puisi .brainly .aistory
 *   .jokes .fakta .namakeren .aibio .motivasi .pantun .komen .bucin
 *
 * Provider keyless (LLM7 → Pollinations) lewat lib/ai.callProvider.
 */
const ai = require('../lib/ai')
const db = require('../lib/db')
const { boxLines } = require('../lib/menu')
const { toWebp } = require('../lib/sticker')
const img = require('../lib/img')
const { truncate } = require('../lib/util')

const SYS_DEFAULT = 'Kamu asisten kreatif berbahasa Indonesia santai alay. Jawab LANGSUNG tanpa basa-basi, tanpa markdown/bintang, maksimal 6 kalimat, gaya orang chat WhatsApp.'

/** tanya AI (keyless) */
async function askAI(prompt, sys = SYS_DEFAULT) {
  const out = await ai.callProvider([
    { role: 'system', content: sys },
    { role: 'user', content: prompt }
  ])
  return truncate(String(out || '').replace(/\*\*/g, '').replace(/^[>#-]\s*/gm, ''), 3800)
}

function needArgs(m, usage, hint) {
  if (!m.args.length) {
    m.reply(`Tulis dulu ya.\nContoh: *${usage}*\n${hint || ''}`)
    return false
  }
  return true
}

/** pollinations image gen → buffer */
async function genImage(prompt, { width = 576, height = 576 } = {}) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 999999)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(90_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 1000) throw new Error('gambar kosong')
  return buf
}

/** helper kirim hasil teks AI */
function aiReply(m) {
  return async (text) => m.reply(text)
}

const commands = [
  /* 1. AI CHAT */
  {
    name: 'ai',
    aliases: ['chat', 'aichat'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'Chat dengan AI (reply pesan/media untuk AI melihatnya)',
    usage: '.ai halo! | reply gambar + .ai apa ini?',
    async run(m, sock, args) {
      const cfg = ai.getAiCfg()
      if (cfg.enabled === false) return m.reply('AI sedang dimatikan owner.')
      const text = args.join(' ')
      if (!text && !m.quoted) {
        return m.reply(
          boxLines('AI CHATBOT', [
            `│ *KARAKTER* : ${cfg.nama} (${ai.PERSONA[cfg.gender]?.label || cfg.gender})`,
            `│ *STATUS*   : ${cfg.enabled ? 'ON' : 'OFF'}${cfg.auto ? ' • AUTO' : ''}`,
            ``,
            `│ Cara pakai:`,
            `│ 1. Balas chat bot → langsung ngobrol`,
            `│ 2. *.ai halo* → tanya apa saja`,
            `│ 3. Reply gambar/video + *.ai*`,
            `│    → AI melihat media kamu`,
            `│ 4. Salah ketik fitur → AI bantu`,
            ``,
            `│ Owner: *.menuowner* → ,aiset`
          ])
        )
      }
      await m.react('🤖')
      await ai.handleAI(sock, m, { force: true, text })
    }
  },

  /* 2. AIRESET */
  {
    name: 'aireset',
    aliases: ['resetai'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'Reset hubungan/mood kamu dengan AI',
    usage: '.aireset',
    async run(m) {
      const d = db.load()
      if (d.aiRel) delete d.aiRel[m.chat]
      if (d.aiHist) delete d.aiHist[m.chat]
      db.save()
      const cfg = ai.getAiCfg()
      m.reply(
        boxLines('AI RELASI RESET', [
          `│ Mood & riwayat dengan *${cfg.nama},`,
          `│ di-reset ke awal.`,
          ``,
          `│ Dia bakal netral lagi ke kamu 🙃`
        ])
      )
    }
  },

  /* 3. AIGAMBAR */
  {
    name: 'aigambar',
    aliases: ['imgai', 'gambarai', 'draw'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI membuat gambar dari deskripsi kamu',
    usage: '.aigambar kucing astronot di bulan',
    async run(m, sock, args) {
      if (!needArgs(m, '.aigambar kucing lucu pakai topi', 'Deskripsikan gambarnya selengkap mungkin.')) return
      await m.react('🎨')
      try {
        const buf = await genImage(args.join(' '))
        await sock.sendMessage(m.chat, { image: buf, caption: `🎨 *${truncate(args.join(' '), 120)}*\nAI image • vex1fz bye ryhn` }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal bikin gambar: ' + e.message + '\nCoba lagi 1-2 menit lagi.')
      }
    }
  },

  /* 4. AISTIKER */
  {
    name: 'aistiker',
    aliases: ['stikerai', 'aisticker'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI bikin gambar → langsung jadi stiker + watermark',
    usage: '.aistiker monster lucu hijau',
    async run(m, sock, args) {
      if (!needArgs(m, '.aistiker naga kecil lucu', 'Deskripsikan stikernya.')) return
      await m.react('🎨')
      try {
        const buf = await genImage(args.join(' '))
        const stamped = await img.stampWm(buf, m.pushName || m.sender.split('@')[0], { size: 24 })
        const webp = await toWebp(stamped)
        await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal: ' + e.message)
      }
    }
  },

  /* 5. AIHTML */
  {
    name: 'aihtml',
    aliases: ['htmlai'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI buatkan file HTML (website/landing page) dari ide kamu',
    usage: '.aihtml landing page kopi susu',
    async run(m, sock, args) {
      if (!needArgs(m, '.aihtml landing page kedai kopi', 'Jelaskan websitenya.')) return
      await m.react('💻')
      try {
        let code = await askAI(
          `Buatkan SATU file HTML lengkap (HTML+CSS+JS inline, tanpa penjelasan, langsung kode saja dalam satu blok kode) untuk: ${args.join(' ')}. Gaya modern, responsive, warna hijau-hitam.`,
          'Kamu expert web developer. BALAS HANYA dengan kode HTML lengkap dalam satu blok kode, tanpa teks penjelasan sama sekali.'
        )
        code = code.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '')
        const fs = require('fs')
        const path = require('path')
        const os = require('os')
        const file = path.join(os.tmpdir(), `vex1fz_${Date.now()}.html`)
        fs.writeFileSync(file, code)
        await sock.sendMessage(m.chat, {
          document: { url: 'file://' + file },
          fileName: 'index.html',
          mimetype: 'text/html',
          caption: `💻 HTML dari AI • vex1fz bye ryhn\nIde: ${truncate(args.join(' '), 100)}`
        }, { quoted: m.raw })
        await m.react('✅')
        setTimeout(() => { try { fs.unlinkSync(file) } catch (_) {} }, 60_000)
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal: ' + e.message)
      }
    }
  },

  /* 6. AIKODE */
  {
    name: 'aikode',
    aliases: ['kodeai', 'codeai'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI tuliskan kode program sesuai permintaan',
    usage: '.aikode python program faktorial',
    async run(m, sock, args) {
      if (!needArgs(m, '.aikode python program kalkulator', 'Sebut bahasa + apa yang dibuat.')) return
      await m.react('💻')
      try {
        const code = await askAI(
          `Tulis kode untuk: ${args.join(' ')}. Beri komentar seperlunya.`,
          'Kamu programmer senior. BALAS dengan kode saja dalam blok kode yang benar, minimal penjelasan, tanpa basa-basi.'
        )
        await m.reply(code)
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal: ' + e.message)
      }
    }
  },

  /* 7. RINGKAS */
  {
    name: 'ringkas',
    aliases: ['summary', 'rekap'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI merangkum teks panjang jadi poin-poin',
    usage: 'reply teks lalu: .ringkas',
    async run(m, sock, args) {
      const text = args.join(' ') || m.quoted?.text
      if (!text) return m.reply('Tulis/reply teks yang mau dirangkum.\nContoh: *.ringkas artikel ini ...*')
      await m.react('📝')
      try {
        const out = await askAI(
          `Rangkum teks berikut jadi poin-poin singkat:\n\n${text}`,
          'Kamu ahli merangkum. Balas HANYA poin-pisin dengan tanda • , tanpa pembuka, maksimal 8 poin.'
        )
        await m.reply(out)
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal: ' + e.message)
      }
    }
  },

  /* 8. TERJEMAH */
  {
    name: 'terjemah',
    aliases: ['translate', 'tr'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'Terjemahkan teks ke bahasa Indonesia/Inggris/Jepang dll',
    usage: '.terjemah good morning | .terjemah id Selamat pagi',
    async run(m, sock, args) {
      let target = ''
      let words = [...args]
      if (args[0] && args[0].match(/^(id|en|ja|ko|ar|ms|jv|sv|fr|es|de)$/i)) {
        target = args[0].toLowerCase()
        words = args.slice(1)
      }
      const text = words.join(' ') || m.quoted?.text
      if (!text) return m.reply('Contoh: *.terjemah good morning*\nAtau: *.terjemah id selamat pagi* (pilih bahasa)')
      await m.react('🌐')
      try {
        const lang = { id: 'Indonesia', en: 'Inggris', ja: 'Jepang', ko: 'Korea', ar: 'Arab', ms: 'Melayu', jv: 'Jawa', sv: 'Swedia', fr: 'Prancis', es: 'Spanyol', de: 'Jerman' }
        const out = await askAI(
          `Terjemahkan ke bahasa ${target ? lang[target] : 'Indonesia (kalau teks asli Indonesia, terjemahkan ke Inggris)'}:\n\n${text}`,
          'Kamu penerjemah profesional. Balas HANYA hasil terjemahan, tanpa penjelasan, tanpa tanda kutip.'
        )
        await m.reply(out)
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal: ' + e.message)
      }
    }
  },

  /* 9. RESEP */
  {
    name: 'resep',
    aliases: ['masak', 'cook'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI kasih resep masakan dari bahan yang kamu punya',
    usage: '.resep telur, sayur, kecap',
    async run(m, sock, args) {
      if (!needArgs(m, '.resep telur, tahu, kecap', 'Sebut bahan yang tersedia.')) return
      await m.react('🍳')
      try {
        const out = await askAI(
          `Beri resep masakan praktis dari bahan: ${args.join(' ')}. Format: nama masakan, bahan, langkah singkat.`,
          'Kamu chef Indonesia ramah. Balas ringkas tanpa markdown aneh, maksimal 10 langkah.'
        )
        await m.reply(out)
        await m.react('✅')
      } catch (e) { await m.react('❌'); m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 10. PUISI */
  {
    name: 'puisi',
    aliases: ['sajak', 'poem'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI bikinkan puisi pendek sesuai tema',
    usage: '.puisi tentang hujan',
    async run(m, sock, args) {
      if (!needArgs(m, '.puisi tentang hujan malam', 'Tentukan temanya.')) return
      await m.react('🎭')
      try {
        const out = await askAI(
          `Tulis puisi pendek (2-4 bait) bertema: ${args.join(' ')}`,
          'Kamu penyair muda Indonesia. Balas HANYA puisinya, indah dan natural, tanpa penjelasan.'
        )
        await m.reply(out)
        await m.react('✅')
      } catch (e) { await m.react('❌'); m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 11. BRAINLY */
  {
    name: 'brainly',
    aliases: ['tanyasoal', 'jawabsoal'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI menjawab soal pelajaran (reply soal untuk foto)',
    usage: '.brainly berapa hasil 12 x 15?',
    async run(m, sock, args) {
      const q = args.join(' ') || m.quoted?.text
      if (!q && !m.quoted) return m.reply('Tulis soalnya.\nContoh: *.brainly 12 x 15 berapa?*')
      await m.react('🧠')
      try {
        const out = await askAI(
          `Jawab soal berikut dengan tepat, beri jawaban akhir dulu lalu penjelasan singkat:\n\n${q || '(soal ada di pesan yang di-reply, teks tidak terbaca)'}`,
          'Kamu guru privat sabar. Jawab akurat, ringkas, bahasa Indonesia, tanpa markdown tebal.'
        )
        await m.reply(out)
        await m.react('✅')
      } catch (e) { await m.react('❌'); m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 12. AISTORY */
  {
    name: 'aistory',
    aliases: ['ceritaai', 'storyai'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI bercerita pendek sesuai permintaan',
    usage: '.aistory hantu yang ingin jadi artis',
    async run(m, sock, args) {
      if (!needArgs(m, '.aistory kucing penjaga warung', 'Tema ceritanya.')) return
      await m.react('📖')
      try {
        const out = await askAI(
          `Tulis cerita pendek seru tapi ringan (maks 400 kata) bertema: ${args.join(' ')}`,
          'Kamu penulis cerita pendek Indonesia. Balas HANYA ceritanya.'
        )
        await m.reply(out)
        await m.react('✅')
      } catch (e) { await m.react('❌'); m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 13. JOKES */
  {
    name: 'jokes',
    aliases: ['lelucon', 'guyon'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI kasih lelucon/becandaan segar',
    usage: '.jokes',
    async run(m) {
      await m.react('🤣')
      try {
        const out = await askAI(
          'Beri satu lelucon Indonesia yang belum basi, gaya anak tongkrongan, endingnya kocak.',
          'Kamu komedian. Balas hanya satu joke, maksimal 4 kalimat.'
        )
        await m.reply(out)
      } catch (e) { m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 14. FAKTA */
  {
    name: 'fakta',
    aliases: ['fact', 'faktaunik'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'Fakta unik acak yang belum tentu kamu tahu',
    usage: '.fakta',
    async run(m) {
      await m.react('🧐')
      try {
        const out = await askAI(
          'Beri SATU fakta unik dunia yang menarik dan mengejutkan, sebutkan juga sumber umumnya secara singkat.',
          'Kamu sains communicator. Balas hanya satu fakta, 2-4 kalimat.'
        )
        await m.reply(out)
      } catch (e) { m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 15. NAMAKEREN */
  {
    name: 'namakeren',
    aliases: ['nicknames', 'ncnick'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI usulkan nickname/nama keren untuk game & sosmed',
    usage: '.namakeren ff lucu | .namakeren aesthetic',
    async run(m, sock, args) {
      const tema = args.join(' ') || 'keren dan unik'
      await m.react('✨')
      try {
        const out = await askAI(
          `Beri 10 nickname keren bertema "${tema}" untuk game/sosmed. Format: 1. nama — alasan singkat`,
          'Kamu ahli branding nickname. Balas HANYA daftar 10 nama.'
        )
        await m.reply(out)
      } catch (e) { m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 16. AIBIO */
  {
    name: 'aibio',
    aliases: ['bioai', 'biososmed'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI buatkan bio aesthetic untuk WA/IG/TikTok',
    usage: '.aibio misterius | .aibio lucu alay',
    async run(m, sock, args) {
      const tema = args.join(' ') || 'aesthetic'
      await m.react('✨')
      try {
        const out = await askAI(
          `Buat 8 pilihan bio pendek (maks 8 kata) bertema "${tema}" untuk WhatsApp/IG. Format: 1. bio`,
          'Kamu content creator. Balas HANYA daftar 8 bio.'
        )
        await m.reply(out)
      } catch (e) { m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 17. MOTIVASI */
  {
    name: 'motivasi',
    aliases: ['motivasiin', 'pepatah'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kata-kata motivasi biar semangat lagi',
    usage: '.motivasi',
    async run(m) {
      await m.react('💪')
      try {
        const out = await askAI(
          'Beri kata-kata motivasi singkat yang nampol buat anak muda lagi jatuh, gaya santai bukan gurufasa kaku.',
          'Kamu motivator muda. Balas 2-4 kalimat, natural, tanpa basa-basi.'
        )
        await m.reply(out)
      } catch (e) { m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 18. PANTUN */
  {
    name: 'pantun',
    aliases: ['pantungan'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI buatkan pantun 4 baris',
    usage: '.pantun tentang cinta',
    async run(m, sock, args) {
      const tema = args.join(' ') || 'hiburan'
      await m.react('🎭')
      try {
        const out = await askAI(
          `Buat satu pantun 4 baris bertema ${tema}, jenaka, sampai puitis pas di baris ke-4.`,
          'Kamu master pantun Melayu. Balas HANYA 4 baris pantun tanpa judul.'
        )
        await m.reply(out)
      } catch (e) { m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 19. KOMEN */
  {
    name: 'komen',
    aliases: ['komenstalker', 'comment'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'AI bikin komen kocak untuk foto/status orang',
    usage: '.komen foto dia lagi senyum | reply caption lalu .komen',
    async run(m, sock, args) {
      const teks = args.join(' ') || m.quoted?.text
      if (!teks) return m.reply('Tulis isi fotonya/captionnya.\nContoh: *.komen dia lagi senyum di pantai*')
      await m.react('😈')
      try {
        const out = await askAI(
          `Bikin SATU komen Instagram kocak untuk postingan: "${teks}". Gaya anak lokal, receh, tidak kasar berlebihan.`,
          'Kamu jago komen receh. Balas hanya satu kalimat komen.'
        )
        await m.reply(out)
      } catch (e) { m.reply('⚠️ Gagal: ' + e.message) }
    }
  },

  /* 20. BUCIN */
  {
    name: 'bucin',
    aliases: ['katbucin', 'gombal'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kata-kata bucin/gombalan buat gebetan',
    usage: '.bucin buat cewek',
    async run(m, sock, args) {
      const tema = args.join(' ') || 'gebetan'
      await m.react('💘')
      try {
        const out = await askAI(
          `Buat 5 gombalan/bucin singkat buat ${tema}, natural tidak norak.`,
          'Kamu tukang gombal tapi sweet. Balas HANYA daftar 5 kalimat.'
        )
        await m.reply(out)
      } catch (e) { m.reply('⚠️ Gagal: ' + e.message) }
    }
  }
]

module.exports = commands
