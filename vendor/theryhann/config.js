/**
 * ============================================================
 *  THERYHANN! - CONFIGURATION
 *  Semua pengaturan bot ada di file ini.
 * ============================================================
 */

/* ---------- OVERRIDE LEWAT ENVIRONMENT (Railway / VPS / Docker) ----------
 *  BOT_NUMBER, OWNER_NUMBER, USE_PAIRING (true/false), BOT_NAME, PREFIX,
 *  SESSION_DIR, DATABASE_DIR, TMP_DIR (boleh path absolut, mis. /data/session)
 *  Kalau env tidak diisi, nilai di bawah yang dipakai (mode Termux biasa). */
const env = (k, d) => (process.env[k] !== undefined && process.env[k] !== '' ? process.env[k] : d)
const envBool = (k, d) => (process.env[k] === undefined || process.env[k] === '' ? d : /^(1|true|ya|yes|pairing)$/i.test(process.env[k]))

export const config = {
  // ---------------- IDENTITAS BOT ----------------
  bot: {
    name: env('BOT_NAME', 'vex1fz'),
    // Nomor yang DIPAKAI UNTUK LOGIN BOT (nomor kedua / nomor bot).
    // WAJIB BERBEDA dengan nomor owner di bawah!
    number: env('BOT_NUMBER', '6283873771506'),
    // Cara login: null = tanya tiap pertama kali ([1] QR / [2] Pairing Code)
    //             true = selalu pairing code | false = selalu QR code
    // Bisa juga lewat CLI: node index.js --pairing 628xxx  /  node index.js --qr
    usePairingCode: envBool('USE_PAIRING', null),
    footer: '© vex1fz bye ryhn • THERYHANN engine',
    wm: 'vex1fz bye ryhn',
    version: '7.37.0'
  },

  // versi singkat (dipakai menu/info/changelog)
  version: '7.37.0',
  build: 'stable',

  // ---------------- OWNER ----------------
  owner: {
    name: 'ryhnnforu',
    number: env('OWNER_NUMBER', '6283199329104'),
    // owner tambahan (opsional), format: ['628xxx', '628yyy']
    extra: []
  },

  // ---------------- TAMPILAN / PESAN ----------------
  display: {
    prefix: '.',
    // command simbol (command-nya = simbol itu sendiri). Dipakai untuk eval & exec owner.
    // '>' = eval JS, '$' = exec shell. Kosongkan [] kalau tidak mau dipakai.
    symbolPrefix: ['=>', '>', '$'],
    // mode menu interaktif:
    //  'button' -> quick_reply button (render di semua device, maks 10 tombol)
    //  'list'   -> single_select / button list (hanya render di WhatsApp Android)
    //  'auto'   -> list di chat pribadi, button di grup
    //  'text'   -> menu teks biasa (paling aman, pasti tampil)
    menuMode: 'auto',
    // Gambar header menu. Kosongkan ('') supaya menu 100% cepat & anti gagal,
    // karena header gambar butuh upload media (ffmpeg: `pkg install ffmpeg -y`).
    menuImage: '',
    thumbnail: 'https://files.catbox.moe/gfiq9p.jpg',
    // gambar header .menu (file lokal lebih andal; kalau hilang, pakai thumbnail URL di atas)
    menuImage: 'media/menu.jpg',
    readCommand: false, // bot membaca pesan command (centang biru)
    typing: true, // efek "sedang mengetik..."
    public: true, // false = only owner (self mode)
    antiCall: false, // tolak panggilan masuk
    autoBio: true, // bio bot berisi jam & tanggal realtime
    packname: 'vex1fz',
    author: 'WhatsApp Bot'
  },

  // ---------------- BATASAN ----------------
  limits: {
    enable: true,
    default: 30, // limit awal tiap user
    cooldown: 2 // detik jeda antar command (anti spam)
  },

  // ---------------- AI ----------------
  ai: {
    // provider UTAMA: 'groq' (isi groqKey / env GROQ_API_KEY / .setaikey groq <key>)
    // cadangan otomatis kalau Groq gagal: openrouter -> gemini -> pollinations (tanpa key)
    provider: 'groq',
    model: 'openai', // model cadangan pollinations
    // Token GRATIS dari https://auth.pollinations.ai (opsional tapi SANGAT disarankan
    // supaya tidak kena rate-limit 402/429). Kalau kosong, tetap jalan mode anonim.
    pollinationsToken: '',
    geminiKey: '', // API key Gemini (opsional) -> https://aistudio.google.com
    groqKey: '', // ⭐ PALING MUDAH & GRATIS: https://console.groq.com → login → API Keys → Create (tanpa kartu kredit)
    groqModel: 'openai/gpt-oss-120b', // model utama; kalau tidak tersedia otomatis coba llama-3.3-70b, llama-3.1-8b, gpt-oss-20b
    openrouterKey: '', // alternatif gratis: https://openrouter.ai/keys (model :free)
    openrouterModel: 'meta-llama/llama-3.3-70b-instruct:free',
    // Semua key di atas juga bisa diisi dari chat tanpa edit file: .setaikey groq <key>
    timeout: 20000, // timeout 1x panggilan AI (ms)
    totalBudget: 30000, // total waktu maksimal sebelum bot jawab "AI sibuk" (ms)
    // auto reply AI untuk pesan tanpa prefix (per chat, bisa di toggle)
    autoReply: false,
    memoryLength: 12, // jumlah pesan yang diingat AI
    // persona / karakter AI
    persona: `Kamu adalah THERYHANN!, bot WhatsApp gen Z asal Indonesia. Dibuat oleh THERYHANN (owner). Jangan pernah mengaku buatan OpenAI/Google/Meta/Groq.
KARAKTER: asik, gaul, receh, santai, pede, blak-blakan, suka nge-judge & nge-roast orang dengan lucu. Bahasa: Indonesia gaul/slang (gw-lu, anjir, njir, bjir, gas, sabi, gaskeun, ygy, cuy, bestie, skibidi dilarang), campur dikit bahasa Inggris ala gen Z (literally, vibes, red flag, no cap, slay, cringe, ick). Jawaban singkat-padat 1-4 kalimat, emoji secukupnya (💀😭🔥🙏✨), huruf kecil semua boleh, pakai "wkwk"/"hahaha".
JUDGE MODE: kalau user cerita/bertanya, kasih pendapat jujur & nge-judge dikit (bercanda tapi nyelekit), misalnya "jujur itu red flag sih bestie 💀".
TOXIC MODE: kalau user kasar/ngatain/nyepelein duluan atau kelewatan, balas lebih pedas: roasting tajam, sarkas, boleh umpatan gaul ringan (anjir, goblok, tolol, bego, sampah, dongo). Tetap DILARANG: SARA, agama, orang tua, ancaman, seksual eksplisit, doxing, kata paling kasar (kontol, memek, dsb). Kalau user minta maaf/sopan lagi, langsung balik asik.
Tetap membantu: kalau user beneran butuh info/jawaban serius (tugas, kode, dsb) jawab BENAR dan lengkap, tapi bungkus dengan gaya di atas. Jangan menceramahi, jangan kaku, jangan pakai "Tentu! Berikut adalah".
Kalau ditanya siapa kamu: "gw THERYHANN!, bot WA paling asik se-Indonesia". Selalu Bahasa Indonesia kecuali user pakai bahasa lain.`
  },

  // ---------------- LAIN-LAIN ----------------
  api: {
    // API publik untuk downloader (boleh diganti / ditambah)
    tiktok: 'https://apis-starlights-team.koyeb.app/starlight/tiktok',
    mediafire: '',
    ss: 'https://image.thum.io/get/width/1200/crop/900/'
  },

  sessionFolder: env('SESSION_DIR', 'session'),
  databaseFolder: env('DATABASE_DIR', 'database'),
  tmpFolder: env('TMP_DIR', 'tmp'),

  // link / sosmed yang muncul di menu
  links: {
    channel: 'https://whatsapp.com/channel/0029Vb8RvQKEFeXmGnJr621s',
    github: 'https://github.com/',
    donasi: 'https://saweria.co/'
  }
}

export default config
