# 🤖 VEX1FZ BOT

Bot WhatsApp **Baileys** dengan **ButtonList (tombol "Pilih")**, multi-prefix, minigame HTML
(**InteractiveResponseMessage + HTML**), sistem RPG, fitur downloader & islami.

| | |
|---|---|
| 🧩 Library | `@whiskeysockets/baileys` **7.0.0-rc14** |
| 🔤 Prefix user | `.` — untuk **semua user** |
| 👑 Prefix owner | `/` `,` `=>` — **hanya owner** |
| 👤 Owner | `6283199329104` (LID `168036921303189@lid`) |
| 📱 Nomor bot | **Bisa diatur** (`BOT_NUMBER`) |
| 🖥️ Support | Termux & Panel Pterodactyl |

---

## ✅ FITUR LENGKAP

### Prefix `.` (semua user)
| Perintah | Fungsi |
|---|---|
| `.ping` | Cek respon — animasi bar `▰▱▱▱` + box hasil terstruktur |
| `.menu` | Menu utama — kotak INFO BOT / INFO USER + **list "Pilih"** |
| `.menuowner` | Panduan prefix owner + daftar command owner |
| `.menudonasi` | Menu donasi (Dana/GoPay/Ovo/Saweria) |
| `.menugame` | Menu game (suit, math, tebak, slot, minigame) |
| `.menurpg` | Menu RPG — **tiap game RPG punya struktur sendiri** |
| `.menuislami` | Menu islami (quran, shalat, doa, asmaulhusna) |
| `.menuprofile` | Menu profile (daftar, profile, leaderboard) |
| `.menudownloader` | TikTok ✅, Instagram, Facebook, MediaFire ✅, Twitter |
| `.minigame` | Pilihan game HTML: **dino, flappybird, catur, geometridash** |
| `.dino` `.flappybird` `.catur` `.geometridash` | Buka game (InteractiveResponse + HTML + tombol MAIN) |
| `.ai` `.sticker` `.aireset` | AI chatbot + ubah media jadi stiker |
| `.owner` `.help` `.donasi [nama]` | Info & bantuan |
| `.suit` `.math` `.tebak` `.slot` | Game teks |
| `.rpgdaftar` `.rpgprofile` `.adventure` `.boss` `.shop` `.beli` `.inventory` `.daily` `.leaderboard` | RPG lengkap |
| `.quran` `.shalat` `.doa` `.asmaulhusna` | Islami |
| `.daftar` `.profile` | Profile |

### Prefix `/` (owner — grup)
`/kick` `/promote` `/demote` `/hidetag` `/tagall` `/open` `/close` `/linkgc` `/revoke`

### Prefix `,` (owner — bot)
`,bc` `,ban` `,unban` `,self` `,public` `,join` `,leave` `,setbio` `,setpp` `,block` `,unblock` `,restart` `,resetdb` `,aiset`

### Prefix `=>` (owner — developer)
```
=> 1 + 1          → eval JavaScript
=> process.version → info runtime
=> shell ls -la    → eksekusi perintah shell
```

> **Aturan prefix:** `.` untuk semua orang. `/` `,` `=>` **hanya owner** —
> jika user biasa mengetik `/kick`, bot membalas "🔒 hanya owner".
> Jika owner mengetik `.kick`, bot mengarahkan ke `/kick`.

---

## 🎬 STRUKTUR MENU (sama seperti video contoh)

`.menu` mengirim **pesan ber-kotak** lalu **list "Pilih"**:

```
┌┈┈┈┈┈┈┈○ 「 INFO BOT 」
│ *NAME* : vex1fz
│ *VERSION* : v1.0.0
│ *UPTIME* : 0d 01h 23m 28s
│ *MODE* : PUBLIC
│ *COMMANDS* : 45
└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈○

┌┈┈┈┈┈┈┈○ 「 INFO USER 」
│ *NAMA* : John
│ *AKSES* : USER
│ *LIMIT* : 99/100
│ *DAFTAR* : BELUM
└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈○
```

Kemudian muncul sheet **Pilih** berisi kategori rapi:
`📌 INFORMASI` → `📂 KATEGORI MENU` (DOWNLOADER / GAME / MINIGAME / RPG / ISLAMI / PROFILE / OWNER)
`❔ BANTUAN`. Mengetuk baris akan menjalankan command tersebut.

Setiap submenu (`.menudownloader`, `.menurpg`, dst.) juga memakai **list button**
dengan baris per fitur + deskripsi yang tersusun rapi.

---

## 📲 LANGKAH 1 — INSTALASI DI TERMUX

```bash
# 1. update packages
pkg update && pkg upgrade -y

# 2. install nodejs & unzip
pkg install nodejs unzip -y

# 3. masukkan file vex1fz-bot.zip ke Termux (ke /sdcard atau ~/), lalu:
cd ~
unzip vex1fz-bot.zip
cd vex1fz-bot

# 4. install dependensi
npm install

# 5. atur nomor bot (bisa juga lewat file .env — salin .env.example jadi .env)
#    edit config.js → botNumber: '628xxxxxxx'
#    atau:
echo "BOT_NUMBER=628xxxxxxx" >> .env
echo "LOGIN_MODE=pairing" >> .env

# 6. jalankan
npm start
```

Muncul **PAIRING CODE** 8 digit → buka HP:
**WhatsApp → Perangkat Tertaut → Tautkan dengan nomor telepon → masukkan kode.**

Selesai — bot online, lalu ketik `.menu` dari nomor owner.

> Login via QR: isi `LOGIN_MODE=qr` di `.env`, QR akan tampil di terminal — scan dari HP.

---

## 🖥️ LANGKAH 2 — PANEL PTERODACTYL

### Cara A — Egg NodeJS (paling mudah)
1. Buat server baru di panel dengan **egg NodeJS 20** (yolks `nodejs_20`).
2. **Startup command** (Start Command):
   ```
   npm install --omit=dev && node index.js
   ```
   atau jika panel sudah `npm install` otomatis: cukup `node index.js`.
3. Upload `vex1fz-bot.zip` ke **File Manager** → **Extract** (jadi folder `vex1fz-bot`, masukkan isinya ke root `/home/user` / `/home/container`).
4. Tab **Startup**, isi variable:
   - `BOT_NUMBER` = `628xxxxxxx` (nomor bot)
   - `PORT` = port allokasi panel kamu (biasanya sudah otomatis)
   - `PUBLIC_URL` = `https://domain-panel-kamu:PORT` (untuk link game)
   - `LOGIN_MODE` = `pairing`
5. **Start** server → buka **Console** → muncul **PAIRING CODE** → masukkan di HP (langkah sama seperti Termux).
6. Selesai — ketik `.menu` dari nomor owner.

### Cara B — Dockerfile (container sendiri)
```bash
docker build -t vex1fz-bot .
docker run -d --name vex1fz \
  -e BOT_NUMBER=628xxxxxxx \
  -e PUBLIC_URL=https://domain-kamu:PORT \
  -p 8080:8080 \
  -v vex1fz-auth:/app/auth \
  vex1fz-bot
```
File `pterodactyl/egg-vex1fz.json` disertakan sebagai模板 egg bila ingin import langsung.

### ⚠️ Catatan panel
- **Pairing code muncul di Console panel** (bukan QR).
- Simpan folder `auth/` supaya session tidak hilang saat restart (di Docker pakai volume).
- Untuk link minigame **wajib** isi `PUBLIC_URL` (pakai allokasi port panel, contoh:
  `https://abc123.pterodactyl.host:20123`).

---

## ⚙️ KONFIGURASI (`.env` / `config.js`)

| Variable | Fungsi | Default |
|---|---|---|
| `BOT_NUMBER` | Nomor bot untuk pairing | *(wajib diisi)* |
| `LOGIN_MODE` | `pairing` / `qr` | `pairing` |
| `BOT_MODE` | `public` / `self` | `public` |
| `PORT` | Port server game | `8080` |
| `PUBLIC_URL` | URL publik game HTML | `http://localhost:PORT` |
| `LOLHUMAN_APIKEY` | API key downloader IG/FB/X | kosong |
| `INSTAGRAM_API` / `FACEBOOK_API` / `TWITTER_API` | Endpoint downloader custom | kosong |
| `DAILY_LIMIT` | Limit perintah user/hari | `100` |

Owner, LID, donasi, prefix → edit langsung di **`config.js`**.

---

## 🤖 AI CHATBOT (karakter bisa diatur owner)

Cara kerja:
| Pemicu | Cara |
|---|---|
| **Balas chat bot** | User membalas pesan apa pun dari bot → AI membalas (utama) |
| **Perintah** | `.ai halo` — atau reply gambar/video lalu `.ai` |
| **Auto mode** | `,aiset auto on` → AI membalas semua chat private |
| **Lihat media** | Reply gambar/video + `.ai apa ini?` → AI melihat isinya (butuh vision key) |
| **Stiker** | Kirim gambar/video → balas `.sticker` |

### Karakter (bawaan, bisa diubah owner)
| | Perempuan (default) | Laki-laki |
|---|---|---|
| Sifat | Lembut, lemah, **ngambekan**, marah jika minta hal dewasa | Rada **gay**, **jomok**, ngeselin, **toxic** |
| Template | *"ihhh", "aku gtw", "jangan gitu donggg"* | *"bacot", "lu hitam", "mati aja lu", "lu kontol", "anjng", "memek"* |

### Sistem emosi (seperti manusia)
- User **baik** (makasih/sayang/pinter) → mood **SAYANG** — perhatian & manja
- User **kasar** (kata makian) → langsung **MARAH** — omelan sesuai karakter, sampai minta maaf baru melunak
- User **ngelunjak** (suruh cepat/spam/halo berulang) → **NGAMBEK** (cewek) / **MARAH** (cowok)
- Mood stokastik: sesekali kirim **stiker emosi** (marah/sayang) sesuai kondisi hati
- Toleransi: mood mereda setelah ~5 menit tidak chat / user minta maaf

### Pengaturan owner (prefix `,`)
```
,aiset lihat              → status lengkap
,aiset gender perempuan   → ganti karakter (perempuan|laki)
,aiset nama Vexa          → ganti nama AI
,aiset sifat <teks>       → sifat tambahan kustom
,aiset on | off           → hidup/mati total
,aiset auto on|off        → auto reply semua chat private
,aiset apikey <key>       → API key vision (AI bisa lihat gambar/video)
,aiset baseurl <url>      → provider OpenAI-compatible (default Groq)
,aiset model <nama>       → model AI
,aiset reset              → reset relasi & riwayat semua user
```

### Provider AI
- **Chat**: otomatis pakai provider gratis tanpa key (LLM7 → Pollinations) ✅ langsung jalan
- **Vision (lihat gambar/video)**: butuh API key gratis — langkahnya:
  1. Daftar gratis di **console.groq.com** → **API Keys** → buat key
  2. Kirim ke bot: `,aiset apikey gsk_xxxxxxxx`
  3. (opsional) `,aiset model meta-llama/llama-4-scout-17b-16e-instruct`
  4. Sekarang reply gambar/video + `.ai` → AI melihat isinya (video diambil 1 frame via ffmpeg)
  5. Tanpa key: AI tetap membalas gaya karakter + bilang gambarnya belum bisa dilihat

---

## 🎮 MINIGAME (InteractiveResponseMessage + HTML)

Setiap `.dino` / `.flappybird` / `.catur` / `.geometridash` mengirim 2 pesan:

1. **`InteractiveResponseMessage`** berisi `body.text = <html game>` +
   `nativeFlowResponseMessage { name: "html_content", paramsJson: {html,...} }`
   (jenis pesan sesuai permintaan).
2. **Kartu interaktif** `interactiveMessage` + native flow:
   tombol **▶ MAIN SEKARANG** (`open_webview` → link game) dan **📁 MINIGAME** (`quick_reply`).
   Jika native flow ditolak klien, otomatis fallback ke kartu teks + link.

Game disajikan oleh server bawaan bot di `/games/*.html`:

| Game | Tema | Mirip aslinya |
|---|---|---|
| Dino | Pixel hitam-abu, lanskap gurun | ✅ T-Rex Chrome offline |
| Flappy Bird | Langit biru, pipa hijau, burung kuning | ✅ Flappy Bird klasik |
| Catur | Papan kayu klasik + glyph Unicode | ✅ Chess 8×8 (2 pemain) |
| Geometry Dash | Neon gelap, spike menyala, kubus | ✅ Geometry Dash |

- **Termux**: link `http://localhost:8080/games/dino.html` → buka browser di HP yang sama.
- **Panel**: set `PUBLIC_URL` → link jadi `https://panel-kamu:PORT/games/dino.html`.

---

## ⬇️ DOWNLOADER

| Perintah | Status |
|---|---|
| `.tiktok <link>` | ✅ Langsung jalan (API tikwm, tanpa key) |
| `.mediafire <link>` | ✅ Langsung jalan (scrape, tanpa key) |
| `.ig <link>` | ⚙️ Butuh endpoint API (lihat di bawah) |
| `.fb <link>` | ⚙️ Butuh endpoint API |
| `.twitter <link>` | ⚙️ Butuh endpoint API |

**Langkah mengaktifkan IG/FB/Twitter:**
1. Dapatkan API key gratis — contoh **lolhuman** (chat `@BotLolhuman` di Telegram → kirim `/apikey`).
2. Buka file `.env`:
   ```
   LOLHUMAN_APIKEY=xxxxx
   ```
3. Jika pakai provider lain, isi template endpoint (pakai `{url}` dan `{apikey}`):
   ```
   INSTAGRAM_API=https://api.contoh.com/download/ig?url={url}&apikey={apikey}
   FACEBOOK_API=https://api.contoh.com/download/fb?url={url}&apikey={apikey}
   TWITTER_API=https://api.contoh.com/download/tw?url={url}&apikey={apikey}
   ```
4. Restart bot.

---

## 🗂️ STRUKTUR FOLDER

```
vex1fz-bot/
├── index.js            # entry point + handler prefix
├── config.js           # konfigurasi (owner, nomor bot, prefix, port)
├── server.js           # server game HTML
├── package.json
├── .env.example
├── Dockerfile
├── lib/
│   ├── serialize.js    # parsing pesan + prefix + owner (PN & LID)
│   ├── sender.js       # sendList / sendButtons / sendGameCard
│   ├── menu.js         # struktur semua menu (box gaya video)
│   ├── api.js          # downloader + islami API
│   ├── db.js           # database JSON
│   └── util.js         # utilitas
├── commands/           # semua fitur (dipisah per kategori)
├── games/              # dino.html flappy.html catur.html geometry.html
├── media/menu.png      # banner menu
├── pterodactyl/        # egg panel
└── database/db.json    # dibuat otomatis
```

---

## 🔧 TROUBLESHOOTING

| Masalah | Solusi |
|---|---|
| `BOT_NUMBER belum diisi` | Isi `.env` → `BOT_NUMBER=628...` lalu `npm start` ulang |
| Pairing code tidak muncul | Pastikan `LOGIN_MODE=pairing`, cek koneksi internet, tunggu 5 detik |
| `session logout` | Hapus folder `auth/` → login ulang |
| Link game tidak kebuka (panel) | Isi `PUBLIC_URL` = `https://domain:port` panel |
| Tombol list tidak muncul | Update WhatsApp kamu; pastikan Baileys `7.0.0-rc14` (`npm ls @whiskeysockets/baileys`) |
| `npm install` error di Termux (better-sqlite3/sharp/canvas) | Jalankan `pkg install python make clang -y` lalu ulangi; jika tetap gagal: `npm install --ignore-scripts` (module native dilewati — tidak dipakai bot ini) |
| IG/FB gagal | Lihat bagian **Downloader** di atas |
| Port bentrok | Ganti `PORT` di `.env` |

---

## 📦 DEPENDENSI LENGKAP (`npm ls --depth 0`)

```
vex1fz-bot@1.0.0
+-- @ffmpeg-installer/ffmpeg@1.1.0
+-- @napi-rs/canvas@1.0.8
+-- @whiskeysockets/baileys@7.0.0-rc14
+-- adm-zip@0.6.0
+-- axios@1.20.0
+-- better-sqlite3@12.11.1
+-- chalk@5.6.2
+-- cheerio@1.2.0
+-- csv-parser@3.2.1
+-- file-type@21.3.4
+-- fluent-ffmpeg@2.1.3
+-- form-data@4.0.6
+-- fs-extra@11.4.0
+-- gradient-string@3.0.0
+-- iqc-canvas@1.0.37
+-- jimp@1.6.1
+-- jszip@3.10.1
+-- moment-timezone@0.6.3
+-- node-cache@5.1.2
+-- node-os-utils@3.1.0
+-- node-webpmux@3.2.1
+-- pdfkit@0.19.1
+-- performance-now@2.1.0
+-- pino@10.3.1
+-- qrcode-terminal@0.12.0
+-- sharp@0.34.5
+-- similarity@1.2.1
+-- ssh2@1.17.0
+-- unzipper@0.12.5
`-- xlsx@0.18.5
```

---

## 🚀 DEPLOY KE GITHUB & RAILWAY

### Langkah 1 — Upload ke GitHub
```bash
cd vex1fz-bot
git init
git add .
git commit -m "vex1fz bot v1.0.0"
git branch -M main
git remote add origin https://github.com/USERNAME/vex1fz-bot.git
git push -u origin main
```
> Repo baru dibuat dulu di github.com → *New repository* → **jangan** centang README (biar kosong).
> Atau pakai GH CLI: `gh repo create vex1fz-bot --public --source=. --push`

`.gitignore` sudah benar: `node_modules/`, `auth/` (session), `database/db.json`, `.env` **tidak ikut** ke GitHub. ✅

### Langkah 2 — Deploy ke Railway
1. Buka **railway.com** → login dengan akun GitHub → **New Project**
2. Pilih **Deploy from GitHub repo** → pilih repo `vex1fz-bot` → **Deploy**
   (Railway otomatis pakai `Dockerfile` + `railway.json` yang sudah disediakan)
3. Buka tab **Variables** → tambahkan:
   ```
   BOT_NUMBER   = 628xxxxxxx        (nomor bot, wajib)
   LOGIN_MODE   = pairing
   BOT_MODE     = public
   PUBLIC_URL   = (isi di langkah 5)
   SESSION_DIR  = /data/auth        (biar session tidak hilang)
   DB_FILE      = /data/db.json     (biar database awet)
   ```
4. Tab **Settings → Volumes → Add Volume** → Mount path: **`/data`**
   (volume ini menyimpan session WhatsApp & database supaya tidak hilang saat redeploy)
5. Tab **Settings → Networking → Generate Domain** → dapat link
   `https://xxxx.up.railway.app` → masukkan ke variable
   `PUBLIC_URL=https://xxxx.up.railway.app` → **Redeploy**
6. Buka tab **Logs** → cari bingkai **PAIRING CODE** (8 digit) →
   buka HP: **WhatsApp ▸ Perangkat Tertaut ▸ Tautkan dengan nomor telepon** → masukkan kode
7. Tungung log `✅ vex1fz ONLINE` → selesai! Ketik `.menu` dari nomor owner.

**Tips Railway:**
- Pilih region **Singapore (sin)** biar latency ke Indonesia kecil.
- Game minigame otomatis jadi `https://xxxx.up.railway.app/games/dino.html`
- `,restart` dari owner → Railway menyalakan ulang container otomatis.
- Jika build gagal di native module, tambah variable `NPM_CONFIG_IGNORE_SCRIPTS=true` (module itu tidak dipakai bot).
- Railway punya kuota trial/paid — cek billing di dashboard kalau project sudah lama jalan.

---

## 📜 CATATAN
- Limit harian user: **100 perintah/hari** (owner unlimited, menu/ping gratis).
- Mode `self` → hanya owner; `,public` → semua orang.
- Bot **tidak** memproses pesan dari nomornya sendiri.
- Gunakan bot dengan bijak — penyalahgunaan (spam/broadcast ke orang asing) bukan tanggung jawab developer.

**vex1fz bot** — Baileys 7.0.0-rc14 • Node.js ≥ 18 • MIT
