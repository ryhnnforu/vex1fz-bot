/**
 * 🤖 AILAB — 50 fitur AI siap pakai (kategori AI Menu, v6)
 * ------------------------------------------------------------
 *  Setiap command = template system-prompt khusus + pemanggilan
 *  aiChat() (Pollinations → Gemini → Groq, sesuai config).
 *
 *  PENTING: hampir semua punya *cadangan lokal* (fallback) sehingga
 *  tetap menghasilkan output walau API AI sedang rate-limit/offline.
 *  Kalau fallback tidak tersedia, bot memberi pesan jelas + saran.
 */
import { config } from '../config.js'
import { aiChat } from '../lib/ai.js'
import { truncate, pickRandom } from '../lib/functions.js'

const P = config.display.prefix
const GAYA = '\n\nAturan jawaban: Bahasa Indonesia, pakai markdown WhatsApp (*tebal*, _miring_, bullet •), ringkas & langsung ke inti. Jangan pakai heading markdown (#). Maks 1200 karakter kecuali diminta panjang.'

/* ------------------------- helper ------------------------- */
const butuh = (m, contoh) => {
  const q = m.q || m.quoted?.text || ''
  if (!q.trim()) { m.reply(`Butuh input.\nContoh: ${P}${m.command} ${contoh}`); return null }
  return q.trim()
}

const ai = (command, aliases, description, promptFn, contoh, fallback, opt = {}) => ({
  command: [command, ...aliases],
  category: 'AI Menu',
  description,
  limit: opt.limit ?? 1,
  cooldown: 3,
  contoh,
  run: async m => {
    const q = butuh(m, contoh)
    if (!q) return
    await m.typing()
    const { system, user } = typeof promptFn === 'function' ? promptFn(q, m) : { system: promptFn, user: q }
    try {
      const out = await aiChat(user, [], { system: system + GAYA, timeout: config.ai.timeout || 60000 })
      const teks = truncate(out.trim(), 3800)
      if (!teks) throw new Error('AI membalas kosong')
      return m.reply(`🤖 *${description.toUpperCase()}*\n\n${teks}\n\n_${P}${command} <input> · Powered by ${config.ai.model}_`)
    } catch (e) {
      if (fallback) {
        const lokal = await fallback(q, m)
        if (lokal) return m.reply(`🔌 *${description.toUpperCase()}* (mode offline)\n\n${truncate(lokal, 3500)}\n\n⚠️ AI sedang sibuk/rate-limit (${truncate(e.message, 80)}).\nCoba lagi sebentar, atau isi API key Gemini/Groq di config.js untuk hasil AI penuh.`)
      }
      return m.reply(`❌ AI tidak bisa dihubungi: ${truncate(e.message, 200)}\n\n💡 Solusi:\n▸ Tunggu 10-30 detik lalu coba lagi\n▸ Isi \`ai.geminiKey\` / \`ai.groqKey\` di config.js\n▸ Cek koneksi internet (Termux: \`ping google.com\`)`)
    }
  }
})

/* ------------------------- bank cadangan lokal ------------------------- */
const LOKAL = {
  motivasi: ['Perjalanan seribu mil dimulai dengan satu langkah.', 'Kamu tidak harus hebat untuk memulai, tapi harus memulai untuk jadi hebat.',
    'Kegagalan adalah guru, bukan vonis.', 'Konsisten mengalahkan semangat yang sesaat.', 'Bandingkan dirimu dengan dirimu kemarin, bukan dengan orang lain.'],
  puisi: (tema) => [
    `Di antara riuh hari yang berlari,\n${tema} diam-diam menanti.\nBukan untuk diminta jadi sempurna,\ncukup setia sampai akhir nanti.`,
    `Aku menulis ${tema} di ujung senja,\nsaat langit belajar merelakan warna.\nJika esok lupa namanya,\nbiar puisi ini yang menjaganya.`
  ],
  pantun: (tema) => [
    `Jalan-jalan ke kota tua,\nmampir sebentar membeli duku.\nSoal ${tema} jangan berduka,\nperlahan-lahan pasti berlalu.`,
    `Beli ragi di pasar lama,\ndibawa pulang memakai kereta.\n${tema.charAt(0).toUpperCase() + tema.slice(1)} itu bukan sekadar kata,\ntapi jalan yang kita buka.`
  ],
  caption: (t) => [`${t} — dan hari ini terasa cukup. 🌿`, `Tidak semua ${t} harus dijelaskan, sebagian cukup dirasakan. ✨`,
    `Definisi bahagia sederhana: ${t}. 😌`, `${t.charAt(0).toUpperCase() + t.slice(1)}, terima kasih sudah ada hari ini. 🤍`],
  hashtag: (t) => t.toLowerCase().split(/\s+/).filter(w => w.length > 2).map(w => '#' + w.replace(/[^a-z0-9]/g, '')).concat(['#dailyvibes', '#moodhariini', '#explorepage']).join(' '),
  bio: (t) => [`✨ ${t} | belajar pelan-pelan`, `📍 ${t} — tumbuh setiap hari`, `💫 ${t} · coffee & progress`, `🌱 ${t}, versi terbaik sedang dibangun`],
  slogan: (t) => [`${t}: kecil langkahnya, besar dampaknya.`, `Bersama ${t}, semua jadi lebih mudah.`, `${t} — karena kamu layak yang terbaik.`, `${t}: cepat, tepat, bersahabat.`],
  nama: (t) => [`${t}Hub`, `${t}Kita`, `Go${t.charAt(0).toUpperCase() + t.slice(1)}`, `${t}Verse`, `Ruang${t.charAt(0).toUpperCase() + t.slice(1)}`, `${t}Pro`],
  rencana: (t) => `1. Tentukan tujuan utama dari ${t}\n2. Bagi jadi 3 langkah kecil yang bisa dikerjakan hari ini\n3. Siapkan waktu 30-60 menit tanpa gangguan\n4. Catat progres, evaluasi tiap akhir sesi\n5. Istirahat cukup — konsistensi > kecepatan`,
  ringkas: (t) => `Teks asli (${t.length} karakter):\n\n"${truncate(t, 600)}"\n\nRingkasan offline: teks ini memuat ${t.split(/\s+/).length} kata dengan ${new Set(t.toLowerCase().split(/\W+/).filter(Boolean)).size} kata unik. Untuk ringkasan cerdas, coba lagi saat AI tersedia.`
}

/* ================================================================== */
/*  50 COMMAND                                                         */
/* ================================================================== */
export const ailabCmds = [
  /* ---------- MENULIS & TEKS ---------- */
  ai('aijelaskan', ['jelaskanai', 'explainai'], 'Jelaskan topik dengan bahasa sederhana',
    q => ({ system: 'Kamu guru yang pandai menyederhanakan konsep rumit untuk pemula.', user: `Jelaskan "${q}" dengan bahasa sederhana. Beri 1 analogi sehari-hari dan 3 poin kunci.` }),
    'fotosintesis'),

  ai('aidefinisi', ['definisiai', 'artikata'], 'Definisi sebuah kata/istilah',
    q => ({ system: 'Kamu kamus berjalan yang akurat dan ringkas.', user: `Beri definisi "${q}": arti, contoh pemakaian dalam kalimat, dan sinonimnya.` }),
    'inovasi',
    q => `*${q}* — kata/istilah yang kamu tanyakan.\n\nDefinisi offline belum tersedia untuk kata ini. Coba lagi saat AI aktif.`),

  ai('airangkum', ['rangkumai', 'summarizeai'], 'Rangkum teks panjang jadi poin penting',
    q => ({ system: 'Kamu editor yang ahli merangkum tanpa menghilangkan inti.', user: `Rangkum teks berikut jadi maksimal 5 poin penting:\n\n"""${q}"""` }),
    'tempel teks panjang di sini',
    q => LOKAL.ringkas(q)),

  ai('aitulisulang', ['parafraseai', 'rewriteai'], 'Tulis ulang teks agar lebih enak dibaca',
    q => ({ system: 'Kamu penulis profesional yang menjaga makna asli.', user: `Tulis ulang teks ini agar lebih jelas & mengalir, tanpa mengubah makna:\n\n"""${q}"""` }),
    'teks yang mau ditulis ulang',
    q => `Versi dirapikan (offline):\n\n${q.replace(/\s+/g, ' ').trim()}`),

  ai('aiperbaiki', ['grammarai', 'koreksiai'], 'Perbaiki ejaan/tata bahasa sebuah teks',
    q => ({ system: 'Kamu editor bahasa Indonesia yang teliti.', user: `Perbaiki ejaan, tanda baca, dan tata bahasa teks ini. Tampilkan versi perbaikan lalu daftar kesalahan yang ditemukan:\n\n"""${q}"""` }),
    'saya pergi kepasar kemarin sore',
    q => `Perbaikan dasar (offline):\n\n${q.charAt(0).toUpperCase() + q.slice(1).replace(/\s+/g, ' ')}${/[.!?]$/.test(q) ? '' : '.'}`),

  ai('aisingkat', ['persingkat', 'shorten'], 'Persingkat teks jadi 1-2 kalimat',
    q => ({ system: 'Kamu ahli memadatkan teks.', user: `Persingkat teks ini jadi maksimal 2 kalimat tanpa kehilangan inti:\n\n"""${q}"""` }),
    'teks panjang', q => truncate(q, 200)),

  ai('aiperpanjang', ['kembangkan', 'expand'], 'Kembangkan teks pendek jadi paragraf',
    q => ({ system: 'Kamu penulis konten yang pandai mengembangkan ide.', user: `Kembangkan kalimat berikut jadi 2 paragraf yang informatif:\n\n"""${q}"""` }),
    'olahraga itu penting'),

  ai('aigaya', ['ubahgaya', 'restyle'], 'Ubah gaya bahasa: formal/santai/puitis/lucu',
    (q, m) => {
      const gaya = (m.args[0] || 'formal').toLowerCase()
      const teks = m.args.slice(1).join(' ') || q
      return { system: `Kamu penulis yang bisa meniru gaya bahasa ${gaya}.`, user: `Ubah teks ini jadi gaya *${gaya}*:\n\n"""${teks}"""` }
    },
    'formal aku mau izin telat', q => q.toUpperCase()),

  ai('aiterjemahkan', ['translateai', 'terjemahkanai'], 'Terjemahkan teks ke bahasa apa pun',
    (q, m) => {
      const ke = (m.args[0] && /^[a-z]{2}$/i.test(m.args[0])) ? m.args[0] : null
      const teks = ke ? m.args.slice(1).join(' ') : q
      return { system: 'Kamu penerjemah profesional.', user: ke ? `Terjemahkan ke bahasa ${ke}:\n\n"""${teks}"""` : `Terjemahkan teks berikut (deteksi bahasanya, lalu terjemahkan ke Bahasa Indonesia; jika sudah Indonesia, terjemahkan ke Inggris):\n\n"""${teks}"""` }
    },
    'en aku sayang kamu'),

  ai('aiemoji', ['tambahemoji', 'emojify'], 'Tambahkan emoji yang pas ke dalam teks',
    q => ({ system: 'Kamu editor media sosial yang jago menaruh emoji.', user: `Tambahkan emoji yang relevan ke teks ini (jangan ubah kalimatnya):\n\n"""${q}"""` }),
    'hari ini aku senang sekali',
    q => q + ' ✨😊🔥'),

  /* ---------- KREATIF ---------- */
  ai('aipuisi', ['puisiai', 'buatpuisi'], 'Buat puisi dari tema',
    q => ({ system: 'Kamu penyair Indonesia dengan diksi indah.', user: `Buatkan puisi 3 bait (4 baris tiap bait) bertema "${q}". Beri judul.` }),
    'senja dan rindu', q => pickRandom(LOKAL.puisi(q))),

  ai('aipantun', ['pantunai', 'buatpantun'], 'Buat pantun sesuai tema',
    q => ({ system: 'Kamu ahli pantun Melayu (sampiran + isi, rima a-b-a-b).', user: `Buatkan 3 pantun bertema "${q}". Pastikan rima akhir a-b-a-b.` }),
    'persahabatan', q => pickRandom(LOKAL.pantun(q))),

  ai('aicerita', ['ceritaai', 'buatcerita'], 'Buat cerita pendek dari premis',
    q => ({ system: 'Kamu penulis cerpen yang alurnya menarik.', user: `Tulis cerita pendek 4 paragraf dengan premis: "${q}". Sertakan judul, konflik, dan ending.` }),
    'seorang anak desa menemukan peta harta karun'),

  ai('aidongeng', ['dongengai', 'ceritaanak'], 'Dongeng anak sebelum tidur',
    q => ({ system: 'Kamu pendongeng anak yang hangat dan imajinatif.', user: `Buat dongeng anak (maks 300 kata) tentang "${q}" dengan pesan moral di akhir.` }),
    'kelinci yang takut gelap'),

  ai('ailirik', ['liriknya', 'buatlirik'], 'Tulis lirik lagu (verse + chorus)',
    q => ({ system: 'Kamu penulis lagu pop Indonesia.', user: `Tulis lirik lagu bertema "${q}": 2 verse + 1 chorus + 1 bridge. Tandai bagiannya.` }),
    'rindu kampung halaman'),

  ai('aiskenario', ['naskahai', 'scripts'], 'Buat naskah/skenario pendek',
    q => ({ system: 'Kamu penulis skenario film pendek & konten video.', user: `Buat naskah pendek untuk: "${q}". Format: [ADEGAN] deskripsi, lalu dialog tokoh (NAMA: ...).` }),
    'iklan kopi sachet durasi 30 detik'),

  ai('aidialog', ['percakapan', 'dialogai'], 'Buat dialog 2 tokoh tentang topik',
    q => ({ system: 'Kamu penulis dialog yang natural.', user: `Buat dialog 8-10 baris antara 2 tokoh tentang "${q}". Buat mengalir dan ada kesimpulan.` }),
    'pentingnya menabung'),

  ai('aikarakter', ['karakterai', 'characterai'], 'Buat lembar karakter (untuk novel/game)',
    q => ({ system: 'Kamu worldbuilder & character designer.', user: `Buat lembar karakter untuk "${q}": nama, umur, penampilan, sifat, latar belakang, kelemahan, motivasi, dan rahasia.` }),
    'pendekar wanita dari desa pegunungan'),

  /* ---------- SOSIAL MEDIA ---------- */
  ai('aicaption', ['captionai', 'bikincaption2'], 'Caption Instagram/TikTok dari deskripsi',
    q => ({ system: 'Kamu social media copywriter.', user: `Buat 5 pilihan caption Instagram untuk: "${q}". Campur gaya (santai, inspiratif, lucu). Sertakan emoji.` }),
    'liburan ke pantai', q => LOKAL.caption(q).map(c => '▸ ' + c).join('\n')),

  ai('aihashtag', ['hashtagai', 'tagai'], 'Hashtag relevan untuk sebuah topik',
    q => ({ system: 'Kamu spesialis growth media sosial.', user: `Beri 20 hashtag relevan & spesifik untuk topik "${q}", urut dari yang paling umum ke niche.` }),
    'kuliner pedas', q => LOKAL.hashtag(q)),

  ai('aibio', ['bioig', 'buatbio'], 'Ide bio Instagram/TikTok/WhatsApp',
    q => ({ system: 'Kamu kreator personal branding.', user: `Buat 6 ide bio Instagram singkat (maks 80 karakter) untuk akun bertema "${q}". Sertakan emoji & CTA.` }),
    'toko kue rumahan', q => LOKAL.bio(q).map(b => '▸ ' + b).join('\n')),

  ai('aibuatstatus', ['statuswa', 'buatstatus'], 'Status WhatsApp singkat & menarik',
    q => ({ system: 'Kamu penulis status WA yang relate.', user: `Buat 6 status WhatsApp pendek (maks 100 karakter) tentang "${q}". Campur lucu, bijak, dan nyindir halus.` }),
    'kerja lembur', q => LOKAL.caption(q).map(c => '▸ ' + c).join('\n')),

  ai('aislogan', ['sloganai', 'tagline'], 'Slogan/tagline untuk brand atau kegiatan',
    q => ({ system: 'Kamu brand strategist.', user: `Buat 8 slogan/tagline untuk "${q}". Maksimal 6 kata tiap slogan, mudah diingat.` }),
    'usaha laundry kiloan', q => LOKAL.slogan(q).map(s => '▸ ' + s).join('\n')),

  ai('ainamabisnis', ['namabrand', 'namausaha'], 'Ide nama usaha/brand dari bidang',
    q => ({ system: 'Kamu naming consultant.', user: `Beri 10 ide nama usaha untuk bidang "${q}": nama + arti singkat + kesan yang ditimbulkan. Pastikan mudah diucapkan orang Indonesia.` }),
    'kedai kopi kekinian', q => LOKAL.nama(q).map(n => '▸ ' + n).join('\n')),

  ai('ainamabayi', ['namabayi', 'ideanama'], 'Ide nama bayi + artinya',
    (q, m) => ({ system: 'Kamu ahli nama bayi Nusantara & Islami.', user: `Beri 10 ide nama bayi (${/cewek|perempuan|p/i.test(m.args[0] || '') ? 'perempuan' : /cowok|laki|l/i.test(m.args[0] || '') ? 'laki-laki' : 'laki-laki/perempuan'}) bertema "${q}": nama + asal bahasa + arti.` }),
    'islami bermakna cerdas'),

  ai('aideskripsiproduk', ['deskripsiproduk', 'copywriting'], 'Deskripsi produk untuk jualan online',
    q => ({ system: 'Kamu copywriter marketplace (Shopee/Tokopedia).', user: `Buat deskripsi produk untuk "${q}": judul menarik, 5 bullet keunggulan, spesifikasi, dan CTA. Gaya meyakinkan tapi jujur.` }),
    'keripik pisang coklat 250gr'),

  /* ---------- PENDIDIKAN ---------- */
  ai('aisoal', ['bikinkuis', 'soalai'], 'Buat soal latihan dari sebuah topik',
    q => ({ system: 'Kamu guru yang membuat soal berkualitas.', user: `Buat 5 soal pilihan ganda (A-D) tentang "${q}" + kunci jawaban & pembahasan singkat di akhir.` }),
    'sistem tata surya kelas 6'),

  ai('aiesai', ['esai', 'essayai'], 'Kerangka + esai dari judul',
    q => ({ system: 'Kamu penulis akademik yang terstruktur.', user: `Buat kerangka esai untuk judul "${q}" (pendahuluan, 3 poin isi, kesimpulan) lalu tulis esainya ±300 kata.` }),
    'dampak media sosial pada remaja'),

  ai('aimakalah', ['makalahai', 'kerangkamakalah'], 'Kerangka makalah/laporan',
    q => ({ system: 'Kamu dosen pembimbing penulisan ilmiah.', user: `Buat kerangka makalah untuk topik "${q}": judul, latar belakang, rumusan masalah, tujuan, bab pembahasan (3 sub-bab), kesimpulan, dan saran sumber referensi.` }),
    'pengolahan sampah plastik di sekolah'),

  ai('aidebat', ['argumenai', 'debatai'], 'Argumen pro & kontra sebuah isu',
    q => ({ system: 'Kamu pelatih debat yang adil.', user: `Beri 3 argumen PRO dan 3 argumen KONTRA untuk isu "${q}", masing-masing dengan alasan & data umum. Tutup dengan kesimpulan netral.` }),
    'kerja dari rumah (WFH) permanen'),

  ai('aiprokontra', ['kelebihankekurangan', 'plusminus'], 'Kelebihan & kekurangan sesuatu',
    q => ({ system: 'Kamu analis yang objektif.', user: `Sebutkan 5 kelebihan dan 5 kekurangan dari "${q}", lalu rekomendasi kapan sebaiknya dipilih.` }),
    'iPhone vs Android', q => `*Kelebihan ${q}:* kualitas & dukungan jangka panjang\n*Kekurangan:* harga lebih tinggi\n\n(Analisis lengkap butuh AI aktif)`),

  ai('aiperbandingan', ['bandingkanai', 'versus'], 'Perbandingan 2 hal secara terstruktur',
    q => ({ system: 'Kamu reviewer yang detail & adil.', user: `Bandingkan "${q}" dalam bentuk tabel (kriteria vs pilihan) lalu simpulkan mana yang cocok untuk kebutuhan apa.` }),
    'motor matic vs motor bebek'),

  ai('aibahasa', ['bahasadaerah'], 'Terjemahan ke bahasa daerah (Jawa/Sunda/Minang/dll)',
    (q, m) => {
      const bahasa = (m.args[0] || 'jawa').toLowerCase()
      const teks = m.args.slice(1).join(' ') || q
      return { system: `Kamu penutur asli bahasa ${bahasa}.`, user: `Terjemahkan ke bahasa ${bahasa} (beri 2 tingkat: halus & biasa jika ada):\n\n"""${teks}"""` }
    },
    'jawa selamat pagi semuanya'),

  /* ---------- KODE & TEKNOLOGI ---------- */
  ai('aikode', ['buatkode', 'codeai'], 'Buat kode program dari deskripsi',
    (q, m) => {
      const bahasa = (m.args[0] || '').toLowerCase()
      const dikenal = ['js', 'javascript', 'python', 'php', 'html', 'css', 'sql', 'bash', 'java', 'c++', 'go', 'ts']
      const pakaiBahasa = dikenal.includes(bahasa) ? bahasa : 'JavaScript'
      const deskripsi = dikenal.includes(bahasa) ? m.args.slice(1).join(' ') : q
      return { system: `Kamu programmer senior ${pakaiBahasa}.`, user: `Tulis kode ${pakaiBahasa} untuk: "${deskripsi}". Sertakan komentar singkat & contoh pemakaian.` }
    },
    'javascript fungsi membalik string'),

  ai('aijelaskankode', ['explaincode', 'bedahkode'], 'Jelaskan potongan kode baris demi baris',
    q => ({ system: 'Kamu mentor programming yang sabar.', user: `Jelaskan kode ini baris demi baris dengan bahasa sederhana, lalu simpulkan fungsinya:\n\n\`\`\`\n${q}\n\`\`\`` }),
    'const x = [1,2,3].map(n => n * 2)'),

  ai('aidebug', ['caribug', 'fixerror'], 'Cari & perbaiki bug/pesan error',
    q => ({ system: 'Kamu debugger ahli.', user: `Analisis kode/error berikut: temukan penyebab, jelaskan, dan beri versi yang sudah diperbaiki.\n\n\`\`\`\n${q}\n\`\`\`` }),
    'TypeError: Cannot read properties of undefined'),

  ai('airegex', ['bikinregex', 'polaregex'], 'Buat regex + penjelasan dari kebutuhan',
    q => ({ system: 'Kamu ahli regular expression.', user: `Buatkan regex untuk: "${q}". Berikan pola, penjelasan tiap bagian, dan 3 contoh string yang cocok & tidak cocok.` }),
    'validasi email'),

  ai('aisql', ['querysql', 'bikinsql'], 'Buat query SQL dari kebutuhan',
    q => ({ system: 'Kamu database engineer (MySQL/PostgreSQL).', user: `Tulis query SQL untuk kebutuhan: "${q}". Sertakan nama tabel/kolom asumsi dan penjelasan singkat.` }),
    'ambil 10 user terbaru yang belum pernah login'),

  ai('aihtml', ['webhtml', 'bikinhtml'], 'Buat potongan HTML/CSS siap pakai',
    q => ({ system: 'Kamu front-end developer.', user: `Buat kode HTML+CSS untuk: "${q}". Satu file, responsif, tanpa library eksternal.` }),
    'kartu profil sederhana'),

  ai('aiscript', ['scriptbot', 'fiturbot'], 'Ide/kerangka script fitur WhatsApp bot',
    q => ({ system: 'Kamu developer bot WhatsApp (Baileys, ESM).', user: `Buat kerangka script fitur bot WhatsApp untuk "${q}": struktur plugin (command, category, run), alur logika, dan contoh kode.` }),
    'fitur tebak kata dengan skor'),

  /* ---------- RENCANA & HIDUP ---------- */
  ai('airencana', ['itinerary', 'rencanaperjalanan'], 'Rencana perjalanan/kegiatan per hari',
    (q, m) => ({ system: 'Kamu travel planner yang realistis.', user: `Buat itinerary untuk "${q}" (${m.args[0] && /^\d+$/.test(m.args[0]) ? m.args[0] + ' hari' : '3 hari'}): tiap hari pagi/siang/malam + estimasi biaya + tips.` }),
    'liburan ke Yogyakarta 3 hari', q => LOKAL.rencana(q)),

  ai('aijadwal', ['jadwalharian', 'bikinjadwal'], 'Jadwal harian produktif dari daftar tugas',
    q => ({ system: 'Kamu productivity coach.', user: `Buat jadwal harian (05.00-22.00) berdasarkan: "${q}". Masukkan waktu ibadah, kerja/belajar, istirahat, olahraga.` }),
    'kuliah pagi, kerja part time sore, olahraga'),

  ai('aitarget', ['rencanagoal', 'targetai'], 'Ubah tujuan jadi rencana langkah konkret',
    q => ({ system: 'Kamu coach yang pakai metode SMART.', user: `Ubah tujuan "${q}" jadi rencana SMART: target spesifik, indikator, langkah mingguan (4 minggu), dan kebiasaan pendukung.` }),
    'bisa bahasa Inggris dalam 6 bulan', q => LOKAL.rencana(q)),

  ai('aikeuangan', ['anggarankeuangan', 'budgetai'], 'Saran anggaran dari pemasukan',
    q => ({ system: 'Kamu perencana keuangan pribadi (bukan penasihat investasi).', user: `Buat rancangan anggaran bulanan berdasarkan: "${q}". Pakai prinsip 50/30/20, sebutkan nominal per pos dan tips menghemat.` }),
    'gaji 5 juta per bulan'),

  ai('aimenu', ['menumakan', 'resepmingguan'], 'Susun menu makan + resep sederhana',
    q => ({ system: 'Kamu ahli gizi & koki rumahan.', user: `Susun menu makan (${q}) untuk 3 hari: sarapan/siang/malam + 1 resep detail bahan & cara masak.` }),
    'anak kos budget 20 ribu/hari'),

  ai('ailatihan', ['workoutai', 'olahragai'], 'Program latihan fisik dari kondisi',
    q => ({ system: 'Kamu pelatih kebugaran yang mengutamakan keamanan.', user: `Buat program latihan untuk "${q}": jadwal mingguan, daftar gerakan + set/repetisi, dan peringatan keamanan.` }),
    'pemula di rumah tanpa alat'),

  ai('ainasehat', ['saranku', 'nasihatai'], 'Nasehat/saran untuk situasi tertentu',
    q => ({ system: 'Kamu mentor yang bijak, empatik, tidak menghakimi.', user: `Beri saran untuk situasi berikut: "${q}". Mulai dengan empati 1 kalimat, lalu 3 saran konkret, lalu 1 hal yang harus dihindari.` }),
    'bertengkar dengan sahabat karena salah paham', q => `Untuk "${q}":\n\n1. Tenangkan diri dulu sebelum memutuskan\n2. Bicarakan langsung, jangan lewat chat panjang\n3. Fokus pada solusi, bukan siapa yang salah`),

  ai('aimotivasi', ['motivasiku', 'semangatai'], 'Kalimat motivasi sesuai kondisimu',
    q => ({ system: 'Kamu motivator yang tulus, tidak klise.', user: `Beri 5 kalimat motivasi personal untuk seseorang yang: "${q}". Buat spesifik, bukan kalimat umum.` }),
    'capek kerja tapi takut resign', q => LOKAL.motivasi.map(x => '▸ ' + x).join('\n'))
]

export default { ailabCmds }
