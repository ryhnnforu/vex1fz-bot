/**
 * 🎲 FUN MENU — tebak-tebakan, truth or dare, jodoh, dll
 */
import { config } from '../config.js'
import { aiChat } from '../lib/ai.js'
import { pickRandom, truncate } from '../lib/functions.js'

const TRUTH = [
  'Siapa crush kamu sekarang?',
  'Pernah bohong apa yang paling parah ke orang tua?',
  'Apa hal paling memalukan yang pernah kamu alami?',
  'Siapa orang yang paling kamu kangenin sekarang?',
  'Pernah suka sama teman sendiri?',
  'Apa rahasia yang belum pernah kamu kasih tau siapa-siapa?',
  'Kapan terakhir kamu nangis dan kenapa?',
  'Apa kebiasaan aneh kamu saat sendirian?',
  'Siapa mantan yang paling susah dilupain?',
  'Pernah nyontek? Kapan?'
]

const DARE = [
  'Kirim voice note nyanyi refrain lagu favoritmu!',
  'Ganti foto profil jadi lucu selama 1 jam.',
  'Chat orang terakhir di WhatsApp kamu dengan "aku kangen kamu".',
  'Ketik pakai bahasa daerah selama 10 pesan ke depan.',
  'Bikin status WA isinya pujian buat bot ini.',
  'Kirim sticker paling aneh yang kamu punya 5x berturut-turut.',
  'Ngomong "aku sayang kamu" ke grup ini.',
  'Foto selfie paling jelek lalu kirim ke sini.',
  'Sebutin 5 nama mantan teman-temanmu.',
  'Bikin pantun tentang bot ini sekarang juga!'
]

export default {
  command: ['truth', 'dare', 'tod'],
  category: 'Fun Menu',
  description: 'Truth or Dare random',
  limit: 0,
  cooldown: 2,
  run: async (m) => {
    if (m.command === 'tod') {
      return m.sendButtons({
        title: '🎲 Truth or Dare',
        text: `Pilih salah satu, *${m.pushName || 'kak'}* 👇\n\nSiap menerima konsekuensinya? 😏`,
        buttons: [
          { text: '💬 Truth', id: '.truth' },
          { text: '🔥 Dare', id: '.dare' },
          { text: '🎲 Acak', id: `.${pickRandom(['truth', 'dare'])}` }
        ]
      })
    }
    if (m.command === 'truth') return m.reply(`💬 *TRUTH*\n\n${pickRandom(TRUTH)}`)
    return m.reply(`🔥 *DARE*\n\n${pickRandom(DARE)}`)
  }
}

export const jodoh = {
  command: ['jodoh', 'couple', 'cekjodoh', 'love'],
  category: 'Fun Menu',
  description: 'Cek kecocokan pasangan (hiburan)',
  limit: 0,
  run: async (m) => {
    const [a, b] = m.q.split(/[,|&+]/).map(s => s.trim()).filter(Boolean)
    if (!a || !b) return m.reply(`Contoh: \`${config.display.prefix}jodoh Budi, Siti\``)
    const score = Math.floor(Math.random() * 101)
    const verdict =
      score > 85 ? '💘 JODOH BANGET! Gas nikah!' :
      score > 70 ? '😍 Cocok banget, lanjutkan PDKT!' :
      score > 50 ? '🙂 Lumayan, ada potensi nih.' :
      score > 30 ? '😬 Hmm... perlu usaha lebih.' : '💔 Kayaknya cuma teman aja deh.'
    return m.sendAIRich({
      title: '💕 Cek Kecocokan',
      text: `*${a}* ❤️ *${b}*`,
      table: [
        ['Aspek', 'Nilai'],
        ['Cinta', score + '%'],
        ['Komunikasi', Math.max(20, score - 8) + '%'],
        ['Kepercayaan', Math.min(100, score + 5) + '%'],
        ['Total', score + '%']
      ],
      tip: verdict,
      suggest: ['cek lagi', '.menu']
    }).catch(() => m.reply(`💕 ${a} ❤️ ${b}\n\nSkor: *${score}%*\n${verdict}`))
  }
}

export const tebak = {
  command: ['tebak', 'askai', 'tanyaai'],
  category: 'Fun Menu',
  description: 'Tanya apa saja ke AI (mode santai)',
  limit: 1,
  run: async (m) => {
    if (!m.q) return m.reply(`Contoh: \`${config.display.prefix}tebak siapa aku?\``)
    await m.typing()
    try {
      const ans = await aiChat(m.q, [], {
        system: 'Kamu THERYHANN! bot WhatsApp. Jawab santai, lucu, singkat (maks 2 kalimat), Bahasa Indonesia gaul.'
      })
      return m.reply(`🎲 *${m.q}*\n\n${ans}`)
    } catch (e) {
      const LOKAL = [
        ['Apa yang naik tapi nggak pernah turun?', 'Umur'],
        ['Apa yang punya kaki tapi nggak bisa jalan?', 'Meja'],
        ['Apa yang bertambah banyak kalau dibagi?', 'Ilmu'],
        ['Apa yang punya gigi tapi nggak bisa menggigit?', 'Sisir'],
        ['Apa yang kalau dipanggil malah menjauh?', 'Bayangan'],
        ['Apa yang bisa dipegang tapi nggak bisa dilihat?', 'Janji']
      ]
      const [q2, j] = LOKAL[Math.floor(Math.random() * LOKAL.length)]
      return m.reply(`🎲 *${m.q}*\n\n🔌 AI sedang sibuk, ini tebakan dari bank lokal bot:\n\nQ: ${q2}\nA: *${j}*\n\n_(pesan asli: ${truncate(e.message, 100)})_`)
    }
  }
}

export const wallpaper = {
  command: ['wallpaper', 'wp', 'gambar'],
  category: 'Fun Menu',
  description: 'Cari/generate wallpaper keren',
  limit: 1,
  run: async (m) => {
    const q = m.q || 'aesthetic dark purple anime wallpaper, 4k'
    await m.typing()
    try {
      const { aiImage } = await import('../lib/ai.js')
      const buf = await aiImage(q, { width: 720, height: 1280 })
      return await m.sendImage(buf, `🖼️ *Wallpaper AI*\n▸ ${q}\n\nMau yang lain? \`${config.display.prefix}wallpaper <tema>\``)
    } catch (e) {
      // fallback: foto stok sesuai kata kunci (tidak butuh AI)
      try {
        const kw = encodeURIComponent((m.q || 'nature').split(/\s+/).slice(0, 2).join(','))
        const seed = Date.now()
        const srcs = [
          `https://loremflickr.com/720/1280/${kw}?lock=${seed % 1000}`,
          `https://picsum.photos/seed/${kw}${seed % 997}/720/1280`
        ]
        for (const u of srcs) {
          const r = await fetch(u, { redirect: 'follow' })
          if (!r.ok) continue
          const b = Buffer.from(await r.arrayBuffer())
          if (b.length < 8000) continue
          return await m.sendImage(b, `🖼️ *Wallpaper*\n▸ ${q}\n\nℹ️ Generator AI sedang sibuk, ini foto stok bertema serupa.\nCoba lagi nanti untuk hasil AI: \`${config.display.prefix}wallpaper ${m.q || 'anime'}\``)
        }
      } catch {}
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

const HOW = {
  howgay: ['🏳️‍🌈', 'Gay'], howbucin: ['💘', 'Bucin'], howganteng: ['😎', 'Ganteng'], howcantik: ['🥰', 'Cantik'], howstupid: ['🤪', 'Bokis'],
  howlesbi: ['👩‍❤️‍👩', 'Lesbi'], howbodoh: ['🐣', 'Bodoh'], howjelek: ['🫠', 'Jelek'], howmesum: ['🔞', 'Mesum'], howpintar: ['🧠', 'Pintar'],
  howgoblok: ['🥴', 'Goblok'], howtolol: ['🙃', 'Tolol'], howsange: ['🥵', 'Sange'], howcupu: ['🤓', 'Cupu'], howkeren: ['🕶️', 'Keren'],
  howjomblo: ['🧍', 'Jomblo'], howalay: ['💅', 'Alay'], howsigma: ['🐺', 'Sigma'], howbeta: ['🐑', 'Beta'], howkaya: ['💸', 'Kaya'],
  howmiskin: ['🪙', 'Miskin'], howmalas: ['🛌', 'Malas'], howrajin: ['📚', 'Rajin'], howsetia: ['💍', 'Setia'], howselingkuh: ['🕵️', 'Selingkuh'],
  howtoxic: ['☠️', 'Toxic'], howhalu: ['🌈', 'Halu'], howbaperan: ['🥺', 'Baperan'], howredflag: ['🚩', 'Red Flag'], howgreenflag: ['💚', 'Green Flag'],
  howcringe: ['😬', 'Cringe'], howsus: ['🫣', 'Sus'], howweeb: ['🍥', 'Wibu'], howkpopers: ['💜', 'K-popers'], howgamer: ['🎮', 'Gamer'],
  howgabut: ['🥱', 'Gabut'], howsombong: ['👑', 'Sombong'], howbaik: ['😇', 'Baik'], howjahat: ['😈', 'Jahat'], howpelit: ['🧾', 'Pelit']
}
const KOMEN = v => v >= 90 ? 'udah level dewa, ga bisa diselametin 💀' : v >= 70 ? 'tinggi banget njir, hati-hati ya bestie 😭' : v >= 50 ? 'setengah-setengah, ambigu kayak status hubungan lu 🫠' : v >= 30 ? 'lumayan lah, masih bisa dibina 🙏' : v >= 10 ? 'dikit doang, aman... katanya 🤏' : 'nol besar, suci banget atau jago nyembunyiin? 🤨'
export const howCmd = {
  command: Object.keys(HOW),
  category: 'Fun Menu',
  description: 'Ngukur kadar sifat: howgay/howbodoh/howjelek/howmesum/howpintar/howlesbi/howsigma/howredflag… (' + Object.keys(HOW).length + ' varian, hiburan semata)',
  limit: 0,
  run: async (m) => {
    const target = m.mentioned[0] || m.quoted?.sender || m.sender
    const [ikon, nama] = HOW[m.command] || ['❓', m.command.replace(/^how/, '')]
    // hasil konsisten per orang per hari per jenis (biar ga bisa spam sampai dapat angka bagus)
    const seed = `${m.command}:${target}:${new Date().toISOString().slice(0, 10)}`
    let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
    const val = h % 101
    const bar = '█'.repeat(Math.round(val / 10)) + '░'.repeat(10 - Math.round(val / 10))
    return m.reply(`${ikon} *Kadar ${nama}*\n@${target.split('@')[0]}\n\n\`${bar}\` *${val}%*\n_${KOMEN(val)}_`, { mentions: [target] })
  }
}
export const howList = {
  command: ['howlist', 'daftarhow', 'howmenu'],
  category: 'Fun Menu', description: 'Daftar semua perintah how*', limit: 0,
  run: async m => m.reply(`🎲 *HOW-METER (${Object.keys(HOW).length})*\n\n` + Object.entries(HOW).map(([k, [i, n]]) => `${i} ${config.display.prefix}${k} — ${n}`).join('\n') + '\n\nTag/reply orang buat ngukur dia. Hasil tetap per orang per hari 😏')
}
