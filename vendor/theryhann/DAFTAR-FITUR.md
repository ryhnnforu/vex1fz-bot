# 📚 DAFTAR FITUR THERYHANN! v7.37.0


## 🆕 v7.37.0 — UNO (chat + HTML vs 3 AI), Guitar Flash, studio tombol AI, `.curl`, `.cateof`
| Perintah | Fungsi |
|---|---|
| `.uno` | 🃏 UNO multiplayer di chat (2-8 member): `.unoikut` `.unomulai` `.unomain <n> [warna]` `.unoambil` `.unoskip` `.unowarna` `.unostatus` `.unobubar` (alias: `.unogame` `.mainuno` `.unocard` `.kartuuno` `.unomulti` `.unomultiplayer`) |
| `.unohtml` | 🎴 UNO kartu interaktif, 1 pemain vs 3 AI — hukuman menumpuk, tombol UNO!, klik/D-pad/keyboard, skor tersimpan (alias: `.unocardhtml` `.unogamehtml` `.unokartuhtml` `.mainunohtml` `.unoai` `.unosolohtml`) |
| `.guitarflash` | 🎸 Guitar Flash ritme gitar: 5 lagu × 3 kesulitan, 4 lajur, hold/hammer/chord/solo, multiplier, whammy, star power (alias: `.guitarhero` `.guitar` `.gitarflash` `.gitarhero` `.mainigitar` `.pianohero` `.gitarritme` `.gitarneon`) |
| `.tobutton <fitur>: <judul> \| button 1: <teks>` | 🔘 Ubah teks fitur jadi button list tanpa menulis ulang file (maks 6 tombol); `reset` untuk hapus (alias: `.jadibutton` `.buttonfitur` `.fiturbutton` `.ubahbutton` `.buttonlist`) |
| `.topremium <fitur>` | 👑 Kunci fitur jadi khusus user premium; `reset` buka, `list` daftar, `status` cek (alias: `.premiumfitur` `.fiturpremium` `.kuncipremium` `.premiumlock`) |
| `.fixbutton <fitur>` | 🤖 AI merapikan teks fitur jadi button list — 4 gerbang keamanan, `--pasang` untuk menyimpan, `--list` tanpa AI (alias: `.perbaikibutton` `.aibutton` `.buttonai` `.rapikanbutton` `.fixfiturbutton`) |
| `.curl <url>` | 🌐 HTTP request dari chat: `\| method:POST` `\| header: Nama: nilai` `\| data: a=1` `\| head` `\| raw` `\| file` — owner-only + anti-SSRF (alias: `.httpget` `.ambilurl` `.fetchurl` `.geturl` `.requesturl`) |
| `.cateof <file> <<EOF … EOF` | 📄 Tulis file gaya heredoc Termux dari chat; `.js` otomatis jadi plugin, cek sintaks dulu (alias: `.catheredoc` `.heredoc` `.tulisfile` `.buatfile` `.cateoffile`) |
| `.autocat <file> \| <permintaan>` | 🪄 AI menulis isi file otomatis; `--pasang` untuk menyimpan (alias: `.catotomatis` `.buatfileotomatis` `.aifile` `.fileai` `.generatefile`) |
| `.editfitur <fitur>` | 🛠️ **Diperbarui**: kini ada pratinjau sungguhan (teks / tombol / list) di bawah kartu studio + pintasan `.tobutton` & `.topremium` |

## 🆕 v7.35.0 — Duel turn-based, peti hoki, update anti-reset
| Perintah | Fungsi |
|---|---|
| `.tarung @user [taruhan]` | ⚔️ Duel PvP turn-based: terima/tolak, serang/heal/kabur bergiliran, taruhan escrow (alias: `.byone` `.duelturn` `.tarungpvp` `.tantangduel`; aksi: `.duelterima` `.dueltolak` `.duelserang` `.duelheal` `.duelkabur` `.duelinfo`) |
| `.peti` `.bukapeti` | 🎁 Peti hoki: gratis 1×/hari, hadiah koin acak |
| `bash update.sh` | 🔄 Update ANTI-RESET TOTAL: tolak zip beracun, backup/restore terverifikasi 100%, 10 backup, `--pulihkan` kembalikan data, ubahan HP1 + 17 nilai config dipertahankan (`--fresh` = versi murni) |
| `.totalchat` | 👀 Total pesan grup sejak pelacakan (pendamping `.sider`) |

## 🆕 v7.34.0 — Akinator berkartu HTML jin animasi
| Perintah | Fungsi |
|---|---|
| `.akinator` | 🧞 Kartu HTML jin ANIMASI di intro, tiap tebakan, menang & kalah (jin SVG melayang, mata berkedip, asap lampu, ekspresi per momen, konfeti + hitung hadiah). Fallback gambar+tombol bila client tak mendukung |

## 🆕 v7.33.0 — Akinator chat, tebak hero ML, bungkam, anti tag SW
| Perintah | Fungsi |
|---|---|
| `.akinator` / `.akin` / `.jin` / `.tebakpikiran` | 🆕 AKINATOR CHAT (ganti Akinator Neon HTML) — pikirkan 1 tokoh (nyata/fiksi), jawab ±20 pertanyaan Ya/Tidak (tombol/ketik), jin menebak (maks 3 tebakan, 70 tokoh: presiden, artis, atlet, anime, kartun, superhero). Menang = koin + EXP + skor papan |
| `.akinstop` | Hentikan permainan Akinator kapan saja |
| `.tebakheroml` / `.tebakml` | 🆕 TEBAK HERO ML — tebak 1 dari 24 hero Mobile Legends dari gambar resminya (ada petunjuk role + huruf awal). Hadiah 400 koin + 50 EXP |
| `.heroml <nama>` | Info + gambar resmi hero ML (atau daftar 24 hero) |
| `.bungkam` / `.bukabungkam` / `.listbungkam` | 🆕 BUNGKAM member — semua pesan target otomatis dihapus (admin/owner kebal). Contoh: `.bungkam @628xxx spam` |
| `.antitagsw` / `.antitagswon` / `.antitagswoff` (+ `.setgrup` no. 7) | 🆕 ANTI TAG SW — pesan berisi tag orang + kata "SW" otomatis dihapus + pengirim kena warn (3× = kick). Default mati |

## 🆕 v7.32.0 — Kampung Mati (horror desa 3D), gameweb HD
| Perintah | Fungsi |
|---|---|
| `.kampungmati` / `.kampung` / `.desamati` / `.horrordesa` | 🆕 KAMPUNG MATI — horror desa 3D: 5 babak (Gerbang Bambu → Sumur Tua → Langgar Tua → Kuburan → Balai Desa), NPC manusia vektor penuh (Mbah Karta, Tuyul, Nyi Roro, Ustadz Karim, Lastri, Ki Dalang), gerakan delta-time halus, 2 ending (keris / surat Ibu) |
| `.gamerespon` / `.menugame` | Otomatis menampilkan 16 game cerita (termasuk Kampung Mati) |
| gameweb HD | Framework canvas: ujung garis membulat (round joins/caps) — tampilan semua game cerita lebih halus |

## 🆕 v7.31.0 — Perbaikan igdl/tts/hd/removebg, kartu HTML animasi, toko level
| Perintah | Fungsi |
|---|---|
| `.tts [voice] <teks>` | (fix) Edge neural voice tanpa key — default 🇮🇩 gadis; ardi, jenny, guy, nanami, dll |
| `.hd [4]` / `.removebg` | (fix) mesin lokal: ffmpeg upscale · AI removebg PNG transparan |
| `.igdl <link>` | (fix) 3 lapis pengunduh + opsi IG_COOKIE |
| `.buatguild <nama>` | Kartu HTML animasi saat guild berhasil dibuat |
| `.listguild` / `.listmember <guild>` | Daftar guild / anggota guild — kartu HTML animasi, bisa di-scroll |
| `.daftar nama\|umur` | Kartu pendaftaran baru: ID card tercetak + stempel VERIFIED |
| `.profile` → Money/XP/Limit/Level | Tombol list → 4 kartu HTML animasi berbeda dengan data user (`.money` `.xp` `.limit` `.level`) |
| `.qris` (tombol di `.donasi`) | Kartu QRIS animasi + gambar QR asli |
| `.lbmenu` | Hub leaderboard kartu HTML (podium) + tombol kategori |
| `.topplayer` `.toprpg` `.topkaya` `.toplevel` `.topfun` `.topgame` `.topguild` | Kartu podium + daftar nama user per kategori |
| `.tokolevel` / `.belilevel <no>` | Toko RPG bertingkat sesuai level |

## 🆕 v7.30.0 — MENU2 iPhone, Menu Studio, PLAY2 Spotify Hub, IG Downloader, stalker baru, smeme tebal
| Perintah | Fungsi |
|---|---|
| `.menu2` / `.setmenu2` | Menu ala layar utama iPhone: ketuk ikon kategori → app terbuka (animasi) berisi semua fitur |
| `.buatmenu` | Menu Studio: 8 template × tema × bentuk × layout × font, preview live, Save & Terapkan |
| `.simpanmenu <kode>` | Simpan hasil studio otomatis sebagai menu4/5/6… dan terapkan |
| `.menusaya` / `.hapusmenu N` / `.setmenuN` | Kelola menu kustom |
| `.ytrich <judul>` | (fix) lagu penuh + ganti lagu lewat kotak cari di dalam kartu |
| `.play2 <judul>` | SPOTIFY HUB: kartu Spotify animasi, cari di dalam kartu, lirik, lagu penuh + audio WA |
| `.play2 vibe / kartu / live / next / prev / acak` | Sub-mode Spotify (gabungan spotifyvibe, play3, spotifylive, playerlab) |
| `.igdl <link>` | Downloader Instagram foto/video/reels/carousel (akun publik) |
| `.igpost <user> [1-5]` | Unduh postingan terbaru akun IG |
| `.threadsstalk` `.pinstalk` `.steamstalk` `.mcstalk` | Stalk Threads, Pinterest, Steam, Minecraft (skin full body) |
| `.chessstalk` `.spotifystalk` `.telestalk` `.npmstalk` | Stalk Chess.com, artis Spotify, Telegram, paket NPM |
| `.smeme atas\|bawah` | Stiker meme dengan font tebal ala Impact + WM |

## 🆕 v7.29.0 — Ekonomi RPG terhubung, auto level-up, YT Rich, stalker, menu2 morph
- 🎉 **Auto Level-Up**: EXP dari chat (1x/20 dtk), game, RPG, owner → saat naik level bot kirim **kartu HTML ucapan selamat** (confetti, ring EXP, gelar, hadiah uang lvl×250, HP/energi pulih).
- 👑 **Owner ekonomi**: `.addmoney/.setmoney/.addxp/.addlevel/.setlevel/.resetrpg <@user|nomor|me> <jumlah>` — bisa ke diri sendiri. Uang bot = uang RPG (profil, menu, kartu semua baca `rpg.money`).
- 🏰 **RPG baru**: `.transfer`, `.harian` (streak), `.topkaya`, `.toplevel`, `.raid` (3 lantai boss), `.arena @user <taruhan>` (PvP).
- 🔒 **Wajib daftar**: user belum `.daftar` tidak bisa memakai fitur apa pun (kecuali daftar/menu/help/owner/ping/profile). Matikan: `.set wajibDaftar off`.
- 📱 **Profil gaya iOS** (`.profile`): Dynamic Island, wallpaper gradasi bergerak, widget kaca dengan animasi spring, badge status **Owner / Premium / Member / Belum daftar**, member sejak, ring EXP, ikon app bergoyang saat disentuh.
- ▶ **`.ytrich`**: kartu YouTube Music bergaya Apple Music — cari YouTube di dalam kartu (tanpa API key), lagu penuh di-stream dari server bot (yt-dlp + fallback ffmpeg), lirik bersinkron, shuffle/repeat.
- 🤡 **20 fun cek baru**: cekfemboy, cektolol, cekgoblok, cekbucin, cekjomblo, ceksange, cekgans, cekcakep, cekhalu, cekgabut, cekmiskin, cekkaya, ceksigma, cekbeta, cekredflag, cekgreenflag, cekcringe, ceknolep, cekmesum, cekalay.
- 🏠 **MENU2** rasio 215% (semua sub-menu muat, 1.500+ perintah) + **animasi morph**: ketuk ubin kategori (mis. RPG) → kartu berubah jadi daftar perintah kategori itu, tombol ‹ kembali.
- ✨ **MENU3** lebih elegan: judul serif emas berkilau, panel kaca, garis emas, animasi muncul bertahap.
- 🕵️ **Stalker**: `.tiktokstalk .igstalk .githubstalk .fbstalk .ytstalk .robloxstalk` — foto profil + statistik (semua tanpa API key; IG via HTTP/2).
- 🤖 **AI Groq**: mencoba 5 model bergantian (gpt-oss-120b → llama-3.3-70b → llama-3.1-8b → gpt-oss-20b → llama-4-scout); pesan error kini jelas per provider (mis. "Key Groq DITOLAK (401)"); config.js sudah diperbaiki.

## 🆕 v7.28.0
- Resolusi game web hi-DPI; `.episode<n> <kunci>` + `.kunciku` (kunci unik per pemain); Dunia Voxel lebih tajam & jauh; game baru `.mercusuar`; `.play/.play3` lagu penuh via stream.

## 🆕 v7.27.0
- MENU3 = kartu HTML teks (rasio 150%), `.setmenu3`.
- `.richmusic <judul>` — kartu Apple Music, lagu penuh, lirik bersinkron.

## 🆕 v7.26.0
- `.setmenu3` / `.menu3` — menu video + status + daftar kategori; `.setmenu3 <link mp4>` ganti video.
- MENU2 kini memuat sub menu semua kategori (buka-tutup).
- `.spotifyvibe` cari di kartu & lagu penuh sampai habis diperbaiki.

## 🆕 v7.25.0
- `.spotifyvibe` kini memutar lagu PENUH sampai habis (stream `/a/<id>` dari server bot), fallback cuplikan 30 dtk.

## 🆕 v7.24.0
- `.spotifyvibe <judul>` — kartu Spotify yang warnanya berubah mengikuti lagu, ganti lagu di kartu, lirik realtime, seekbar, log buffering.

## 🆕 v7.23.0
- 💼 `.sewabot` sewa per grup, auto keluar saat habis · `.ceksewa`
- 🧱 `.dunia` Dunia Voxel — game web 3D survival/craft, NPC bicara/barter/duel, 12 quest, save dunia 3 slot
- 🤖 Persona AI gen-Z (asik, judge, toxic bila dipancing)
- 🎲 40 how-meter (`.howlist`)

## 🆕 v7.22.0
- 📸 `.swgc <caption>` — unggah Status GRUP WhatsApp asli (status milik grup, bukan bot); media/teks

## 🆕 v7.21.0
- 🌐 Game cerita versi web: kartu DETAIL MINIGAME + tombol ▶ Mainkan Sekarang (buka di pratinjau WhatsApp), progres otomatis, ❤️ like
- ⚙️ `.setwebgame on/off | url <domain>` (owner)

## 🆕 v7.20.0
- 🕯️ `.rumah13` Rumah Nomor 13 — horror 3D orang-pertama, NPC dialog + barter, 5 malam
- 👻 `.desapixel` Desa Pixel Terkutuk — pixel-horror top-down, NPC dialog + barter, 5 malam
- 🤖 Groq jadi provider AI utama

## 🆕 v7.19.0
- **`.neondrift`** — Neon Drift: mengemudi 3D open world neon + cerita 6 malam (antar, kabur dari polisi/geng, balapan; nitro, drift, minimap, radio).
- Perbaikan menu 10 game cerita (item tidak lagi tertutup tombol kontrol).

## 🆕 v7.18.1
- **`.droneview`** — Drone View 3D open world tanpa batas + cerita 5 episode (2 joystick, 3 kamera, hujan/malam/kabut).

## 🆕 v7.18.0
- **Game cerita ber-episode** (`.arcadecerita`): `.neonrunner` `.lautdalam` `.penjagakuil` `.kurirluar` `.detektifkota` `.sawahnusantara` `.gladiator` `.pilotdrone` `.penyihirrune` `.kotasenja` — ≥5 episode, UI/backsound beda, kode `epN-xxxxx` membuka episode berikutnya (bot kirim tombol lanjut).
- **`.igqc`** → foto screenshot DM Instagram (`.igqc stiker` untuk stiker).
- **MENU2**: `.setmenu2` / `.setmenu1` / `.menu2` — menu HTML portrait animasi, item bisa diketuk.

> **1276 perintah** dalam **15 kategori** — dibuat otomatis oleh `scripts/build-daftarfitur.js`.
> Prefix: `.` · Di dalam bot: `.menu` (button list), `.allmenu` (semua), `.carimenu <kata>` (pencarian), `.menuapp` (aplikasi HTML).

## Ringkasan

| Kategori | Plugin | Perintah+alias | Contoh |
|---|---:|---:|---|
| 🎮 Games | 279 | 1186 | `.uno` `.unohtml` `.guitarflash` |
| ⚔️ RPG Menu | 174 | 650 | `.berburu` `.battle` `.rpg` |
| 👑 Owner Menu | 137 | 473 | `.>_` `.cateof` `.fixbutton` |
| ⬇️ Downloader | 103 | 402 | `.tiktok` `.get` `.ss` |
| 👥 Group Menu | 107 | 363 | `.group` `.kick` `.linkgroup` |
| 🛠️ Tools | 127 | 338 | `.toimg` `.fancy` `.curl` |
| 🎲 Fun Menu | 90 | 320 | `.truth` `.howgay` `.jodoh` |
| 🌟 Sticker Menu | 95 | 317 | `.stikerkutipan` `.stikernama` |
| 🌐 Internet | 87 | 259 | `.cuaca` `.google` `.kurs` |
| 🕌 Islami | 106 | 252 | `.sholat` `.kiblat` `.ayat` |
| ℹ️ Info Menu | 80 | 251 | `.ping` `.negara` |
| 👤 User Menu | 81 | 250 | `.afk` `.ingatkan` `.claim` |
| 🤖 AI Menu | 72 | 236 | `.aiimg` `.airich` `.ai` |
| 🏠 Main Menu | 71 | 227 | `.allmenu` `.rules` `.listcmd` |
| 📦 Premium | 23 | 100 | `.premmenu` `.premclaim` `.topremium` |
| **Total** | **1632** | **5624** | |

_Angka dihitung langsung dari loader pada v7.37.0 (1632 plugin terdaftar menu, 5624 perintah+alias; total keseluruhan 1637 plugin / 5661 alias termasuk yang tersembunyi)._


---

## 🎮 Games (196 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.gameairich` | `airichgame` `airichgames` `gameair` | Menu game berbasis AI Rich response message | semua |
| `.batalairich` | `stopairich` `airichstop` | Hentikan game AI Rich yang berjalan | semua |
| `.kuisairich` | `kuisair` `airichquiz` `quizairich` | Kuis pilihan ganda via AI Rich (jawab dengan ketuk pill) | semua |
| `.suitairich` | `suitai` `airichsuit` | Suit batu-gunting-kertas via AI Rich | semua |
| `.tttairich` | `tttai` `airichttt` `xoairich` | Tic-tac-toe via AI Rich (papan live-edit) | semua |
| `.airichmine` | `minesweeperai` `ranjauairich` | 💣 Minesweeper 4×4 via AI Rich (buka sel, hindari ranjau) | semua |
| `.airich2048` | `2048airich` `airichdua048` | 🔢 2048 via AI Rich (geser papan, gabung angka) | semua |
| `.airichmemory` | `memoryairich` `memaairich` `kartuairich` | 🃏 Memory match 12 kartu via AI Rich | semua |
| `.airichular` | `ulartanggaairich` `airichsnake` | 🐍 Ular tangga vs bot via AI Rich | semua |
| `.airichconnect` | `connect4airich` `airich4` `fourairich` | 🔴 Connect Four vs bot via AI Rich | semua |
| `.airichblackjack` | `bjairich` `blackjackai` `airich21` | 🂡 Blackjack vs bandar via AI Rich (taruhan koin) | semua |
| `.airichroulette` | `roletairich` `airichrolet` | 🎡 Roulette via AI Rich (merah/hitam/angka 0-36) | semua |
| `.airichslot` | `slotairich` `airichmesin` | 🎰 Slot machine via AI Rich (3 gulungan) | semua |
| `.airichdadu` | `daduairich` `airichdice` `dueldadu` | 🎲 Duel dadu best-of-3 vs bot via AI Rich | semua |
| `.airichhighlow` | `highlowairich` `airichnaikturun` `higherlower` | ⬆️ Higher-Lower kartu via AI Rich (streak & pengali) | semua |
| `.airichmath` | `mathairich` `airichhitung` `sprintangka` | ➗ Math sprint 10 soal via AI Rich | semua |
| `.airichreaction` | `reaksiairich` `airichrefleks` `reactiontest` | ⚡ Tes refleks via AI Rich (ukur milidetik) | semua |
| `.batalairichlab` | `stopairichlab` `batalgameairich` | Hentikan game AI Rich v7 yang sedang berjalan | semua |
| `.mainlagi` | `ulangaairich` `rematchairich` | Ulangi game AI Rich terakhir yang kamu mainkan | semua |
| `.airichtrivia` | `triviaairich` `airichquiz2` `kuisairich2` | 🧠 Trivia campuran (negara/kimia/surah/umum) via AI Rich | semua |
| `.airichangka` | `tebakangkaairich` `airichtebakangka` | 🔢 Tebak angka 1-100 (7 kesempatan) via AI Rich | semua |
| `.airichsusunkata` | `susunkataairich` `airichkata` | 🔤 Susun huruf acak jadi kata via AI Rich | semua |
| `.airichemoji2` | `tebakemojiairich` `emojiairich` | 😀 Tebak arti rangkaian emoji via AI Rich | semua |
| `.airichrantai` | `rantaikataairich` `airichkata2` | 🔗 Rantai kata vs bot via AI Rich | semua |
| `.airichharga` | `tebaharga` `tebakaharga` `airichprice` | 💵 Tebak harga barang (selisih ≤15%) via AI Rich | semua |
| `.airichsimon` | `simonairich` `airichwarna` `warnamemory` | 🎨 Simon: ingat urutan warna, 8 level, via AI Rich | semua |
| `.airichpanah` | `panahanairich` `airicharchery` | 🏹 Panahan: bidik dengan memperhitungkan angin via AI Rich | semua |
| `.airichmancing` | `mancingairich` `airichfishing` | 🎣 Mancing kilat (timing) — ikan masuk inventory RPG | semua |
| `.airichbattle` | `battlerpg` `airichfight` `pertarunganairich` | ⚔️ Battle RPG turn-based via AI Rich (pakai HP/ATK/DEF karaktermu) | semua |
| `.airichdungeon` | `dungeonairich` `airichcrawl` | 🏰 Dungeon crawl 5 ruang via AI Rich — loot masuk inventory | semua |
| `.airichlelang` | `lelangairich` `airichauction` `auctionairich` | 🏷️ Lelang item langka vs NPC via AI Rich (koin RPG) | semua |
| `.airichgamelab` | `gameairich2` `airichgames2` `daftargameairich` `menuairichgame` | Menu 24 game AI Rich v7 (pill bisa diketuk) | semua |
| `.airichbantuan` | `bantuanairich` `airichhelp` `panduanairich` | Panduan fitur AI Rich: cara kerja pill, live edit, fallback | semua |
| `.airichstatistik` | `statairich` `airichstat` | Statistik game AI Rich kamu (main/menang/kalah/skor terbaik) | semua |
| `.airichleaderboard` | `lbairich` `rankairich` `topairich` | Peringkat pemain game AI Rich (berdasarkan kemenangan & skor) | semua |
| `.airichtes` | `tesairich` `cekairich` `dukungairich` | Tes apakah device kamu mendukung AI Rich message | semua |
| `.airichriwayat` | `riwayatairich` `historyairich` | Riwayat game AI Rich yang pernah kamu mainkan | semua |
| `.airichreset` | `resetairich` `hapusstatairich` | Reset statistik game AI Rich kamu (minta konfirmasi) | semua |
| `.akinator` | `akin` `jin` `tebakpikiran` `pembacapikiran` | 🧞 Akinator chat + kartu HTML jin ANIMASI (intro/tebakan/menang/kalah) — 70 tokoh, maks 3 tebakan, koin+EXP+skor | semua |
| `.akinstop` | `stopakin` `batalakin` | Hentikan permainan Akinator | semua |
| `.arcadelist` | `daftararcade` `listarcade` `arcademenu` | Daftar game arcade HTML dalam bentuk list (klik langsung main) | semua |
| `.arcadelist2` | `daftararcade2` `listarcade2` `arcadedpadlist` | Daftar 5 game arcade baru (v7.2) dalam bentuk list interaktif | semua |
| `.arcadelist3` | `daftararcade3` `listarcade3` `arcadepuzzlelist` `listpuzzle` | Daftar 4 game arcade puzzle (v7.3) dalam bentuk list interaktif | semua |
| `.arcade` | `htmlgame` `htmlgames` `webgame` `arcadehub` | Menu game HTML interaktif (jalan di dalam chat) | semua |
| `.arcade2` | `arcadeneon2` `arcadedpad` `dpadgame` `dpadgames` `arcadebaru` `arcadev2` `gamedpad` | Submenu 5 game HTML baru (v7.2) — kontrol D-pad ▲▼◀▶ + ●, ratio canvas tiap game beda | semua |
| `.arcade3` | `arcadepuzzle` `arcadepapan` `puzzlegame` `puzzlegames` `arcadeneon3` `arcadev3` `gamepuzzle` `boardgame` | Submenu 4 game HTML (v7.3) — puzzle & papan: block blast, catur, minesweeper, asteroids + tombol 🧞 Akinator (chat) | semua |
| `.arcade5` | `arcadeasli` `gameasli` `rupaasli` `arcadeoriginal` | ✨ Submenu 3 game HTML rupa asli: Flappy Bird · Pac-Man · Subway Surf (D-pad menyesuaikan tiap game) | semua |
| `.asteroids` | `asteroidsneon` `batuangkasa` `hancurkanbatu` `asteroidgame` `neonroids` | Asteroids Neon — putar & dorong pesawat, tembak batu sampai pecah, ▼ lompat ruang (3 nyawa) | semua |
| `.blockblast` | `blockblastneon` `susunblok` `blastblok` `blok8x8` `ledakbaris` | Block Blast Neon — papan 8×8: taruh 3 blok per ronde, isi baris/kolom penuh supaya meledak | semua |
| `.breakout` | `breakoutneon` `brickbreaker` `hancurkanbata` `pantulkanbola` | Breakout Neon — pantulkan bola, hancurkan bata (3 nyawa, level makin cepat) | semua |
| `.catur` | `caturneon` `chess` `chessneon` `caturname` `skakmat` | Catur Neon — catur lengkap (rokade, promosi, skak, skakmat) melawan AI minimax, jam 90 detik | semua |
| `.2048` | `d2048` `twenty48` `gabungangka` | 2048 — geser semua tile ke satu sisi, gabungkan yang sama, raih 2048. Penampilan seperti game aslinya | semua |
| `.gd` | `gdmini` `geometrydash` `geometry` | Geometry Dash Mini — HTML game (canvas) di dalam chat | semua |
| `.snake` | `snakeneon` `neonsnake` | Snake Neon — HTML game (canvas) di dalam chat | semua |
| `.flappy` | `flappyneon` `neonflappy` | Flappy Neon — HTML game (canvas) di dalam chat | semua |
| `.spaceshooter` | `shooterneon` `tembakmusuh` `pesawattempur` `galaxwar` | Space Shooter — pesawat auto-tembak, musuh bergelombang + peluru musuh | semua |
| `.dino` | `dinorun` `laridino` `runnerneon` `dinolompat` | Dino Run — endless runner: lompat kaktus, menunduk hindari burung | semua |
| `.tetris` | `tetrisneon` `susunbalok` `blokneon` | Tetris Neon — 7 tetromino, putar/jatuhkan, bersihkan baris | semua |
| `.pong` | `pongneon` `pingpong` `vscpu` `rebound` | Pong Neon — lawan CPU, first-to-3, bola makin cepat tiap pukulan | semua |
| `.neonjump` | `jumpneon` `lompatneon` `jumphero` `lompatplatform` | Neon Jump — lompat antar platform, layar terus naik, jangan jatuh | semua |
| `.frogger` | `froggerneon` `katakneon` `kodoklompat` `seberangjalan` `seberangsungai` | Frogger Neon — seberangi 4 lajur mobil & 3 sungai pakai log, isi 4 slot (▲▼◀▶) | semua |
| `.maze` | `mazeneon` `labirin` `labirinneon` `carikoin` `jelajahlabirin` | Maze Neon — labirin acak 15×15: ambil semua koin lalu keluar lewat pintu (▲▼◀▶) | semua |
| `.racing` | `neonracer` `racerneon` `balapmobil` `balapan` `touringneon` | Neon Racer — balap 4 lajur: ◀▶ pindah lajur, ▲ gas, ▼ rem, hindari mobil & truk | semua |
| `.tank` | `tankneon` `perangtank` `tankbattle` `tankperang` `neontank` | Tank Neon — gerak 4 arah di arena, turret membidik otomatis, berlindung di balik blok | semua |
| `.neonhunt` | `huntneon` `berburudrone` `tembakdrone` `bidikneon` `huntgame` | Neon Hunt — geser bidikan 4 arah, tekan ● untuk menembak drone, penuhi kuota ronde | semua |
| `.minesweeper` | `minesweeperneon` `sapuranjau` `ranjau` `minesneon` `ladangranjau` | Minesweeper Neon — 4 level (9×9 s/d 13×13): gali sel aman, tahan ● untuk bendera, hindari ranjau | semua |
| `.flappybird` | `flappyasli` `flappyoriginal` `burungflappy` `fb` | Flappy Bird — tampilan persis aslinya: burung kuning, pipa hijau, tanah bergaris, medali. Kontrol cuma ● / tap | semua |
| `.fruitninja` | `fruitslice` `ninjabuah` `slicefruit` `sapufruma` | Fruit Ninja — iris buah yang melempar: tap langsung di buahnya atau ▲▼◀▶ gerakin kursor lalu ● = iris. Kombo ×3+ momen! 💣 hilang nyawa. | semua |
| `.pacman` | `pacmanasli` `pakman` `pacmen` `hantukuning` | Pac-Man — labirin biru klasik 28×31, 4 hantu (Blinky/Pinky/Inky/Clyde), power-pellet, buah bonus. D-pad ▲▼◀▶ | semua |
| `.subway` | `subwaysurf` `subwaysurfers` `surfers` `larikereta` `subwayrun` | Subway Surf — lari 3 jalur perspektif: kereta, palang, koin, hoverboard. ◀▶ jalur · ▲ lompat · ▼ guling · ● hoverboard | semua |
| `.missile` | `missilecommand` `rudalneon` `cegatrudal` `pertahanankota` `misilneon` | 🛰️ Missile Command Neon — game arcade neon HTML app: hujan rudal menghantam 3 kota: ▲▼◀▶ arahkan crosshair, ● luncurkan pencegat dari baterai terdekat · ledakan menghancurkan rudal · 6 gelombang | semua |
| `.lukis` | `lukisneon` `catneon` `painter` `qix` `warnagrid` | 🧊 Lukis Neon — game arcade neon HTML app: cat 75% grid untuk naik level: ▲▼◀▶ geser kuas, rantai cat panjang = poin besar · percik api memangkas nyawa · makin tinggi level makin cepat | semua |
| `.lander` | `lunarlander` `landerneon` `mendaratbulan` `gravitasineon` `kapalbulan` | 🌙 Lunar Lander Neon — game arcade neon HTML app: fisika roket sungguhan: ▲ tahan untuk menyalakan mesin, ◀▶ putar kapal, ▼ rem samping · mendarat di garis hijau dengan kecepatan & sudut aman · bahan bakar terbatas | semua |
| `.spiral` | `spiralneon` `helixneon` `celahcincin` `menarabola` `celahspiral` | 🌀 Spiral Neon — game arcade neon HTML app: geser menara supaya bola masuk celah cincin: ◀▶ geser (tahan untuk halus) · celah tengah = bonus · level naik tiap 12 cincin, celah makin sempit | semua |
| `.bomber` | `bomberneon` `pasangbom` `ledakgrid` `bomneon` `bomberman` | 💣 Bomber Neon — game arcade neon HTML app: pasang bom untuk menghancurkan grid & musuh: ▲▼◀▶ jalan (tahan tombol untuk terus bergerak), ● pasang bom · ledakan berbentuk + setelah 2 detik · power-up | semua |
| `.arcadelist4` | `daftararcade4` `listarcade4` `semuaarcade` | Daftar semua 29 game arcade neon HTML app dalam bentuk list interaktif | semua |
| `.arcade4` | `arcadeneon4` `arcadev4` `gamearcade4` `arcadeaksi` | Submenu 5 game arcade neon HTML app baru v7.6 (Missile Command, Lukis, Lunar Lander, Spiral, Bomber) | semua |
| `.baccarat` | `bakarat` `baccaratgame` `playerbanker` `bacarat` | Baccarat — ◀▶ pilih PLAYER/BANKER/TIE · ▲▼ taruhan · ● deal, lengkap dengan aturan kartu ketiga | semua |
| `.crash` | `aviator` `crashgame` `roketcrash` `crashmultiplier` `roket` | Crash/Aviator — roket meluncur, pengali naik real-time: ▲▼ taruhan · ▼ auto cash-out · ● luncur/tarik | semua |
| `.casinolist` | `daftarcasino` `listcasino` | Daftar 10 meja kasino HTML app (5 uang RPG asli + 4 chip lokal) dalam bentuk list interaktif | semua |
| `.casino` | `kasino` `casinogame` `judikoin` `casinomenu` | Submenu kasino HTML app: slot/poker/crash/baccarat (chip lokal) + .slot uang RPG asli | semua |
| `.poker` | `poker5` `fivecard` `pokerdraw` `kartupoker` `fivecarddraw` | Poker 5-Card Draw — vs CPU: ◀▶ pilih kartu · ● tahan · ▲ tukar, adu kombinasi (Royal Flush s/d High Card) | semua |
| `.slotchip` | `slotcasino` `slotarcade` `slotdemo` `chipslot` `slotmesinchip` `slothtml` | Casino Slot versi CHIP lokal (hiburan, tanpa uang RPG) — 3 gulungan beranimasi: ◀▶ taruhan · ▲ max · ▼ auto-spin · ● putar. Uang asli: .slot | semua |
| `.aviatorrpg` | `crashrpg` `aviatorkoin` `roketuang` `aviatorjudi` `crashkoin` `kurvanaik` | 📈 Aviator RPG — kurva multiplier naik lalu jebol; tentukan target cash-out, taruhan pakai uang RPG asli (RTP ≈94%) | semua |
| `.batal21` | `batalblackjack` `surrender21` `nyerah21` `batalkartu21` | 🃏 Batalkan ronde blackjack yang berjalan (taruhan hangus) | semua |
| `.double21` | `doubleblackjack` `gandakartu21` `gandataruhan21` `doublebj` | 🃏 DOUBLE — gandakan taruhan, ambil tepat satu kartu, lalu otomatis stand | semua |
| `.hit21` | `hitblackjack` `tambahkartu21` `tarik21` `hitbj` | 🃏 HIT — tambah satu kartu di ronde blackjack RPG yang sedang berjalan | semua |
| `.stand21` | `standblackjack` `tahankartu21` `cukup21` `standbj` | 🃏 STAND — berhenti menarik kartu; bandar membuka kartu & main sampai total ≥ 17 | semua |
| `.blackjack21` | `bjrpg` `blackjackrpg` `kartu21` `twentyonerpg` `duapuluhsaturpg` `mainblackjack` | 🃏 Blackjack RPG — mulai ronde dengan uang RPG asli, lalu .hit21 / .stand21 / .double21 (bandar stand di 17) | semua |
| `.daduinfo` | `infodadu` `sicboinfo` `daduodds` `dadustatistik` | 🎲 Peluang, pengali & RTP tiap taruhan dadu RPG + statistik pribadi | semua |
| `.dadukoin` | `dadurpg` `sicbo` `sicborpg` `tigadadu` `daduuang` `lempardadu` `dadubesar` | 🎲 Dadu RPG (sic bo) — 3 dadu diacak server, taruhan uang RPG: besar/kecil, genap/ganjil, jumlah 3–18, pair, triple | semua |
| `.kasinoinfo` | `infokasino` `statistikkasino` `kasinostat` `riwayatkasino` `rtpkasino` | 📊 Statistik & riwayat 5 game kasino RPG + slot (ronde, menang, untung/rugi, RTP pribadi) | semua |
| `.kasinorpg` | `kasinouang` `casinorpg` `judirpg` `kasinokoin` `rpgkasino` `kasinojudi` | 🎰 Menu 5 game kasino RPG (rolet, dadu, aviator, keno, blackjack) — taruhan pakai uang RPG asli | semua |
| `.kenoinfo` | `infokeno` `kenotabel` `kenoodds` `kenostatistik` | 🎯 Tabel pembayaran, peluang & RTP keno RPG + statistik pribadi | semua |
| `.keno` | `kenorpg` `kenokoin` `lotre40` `kenolotre` `undiangka` `kenoangka` | 🎯 Keno RPG — pilih 1–6 angka dari 40, 10 angka diundi server, taruhan uang RPG asli (RTP 84–91%) | semua |
| `.roletinfo` | `roletinfoo` `inforolet` `roletodds` `roletstatistik` `roletstat` | 🎡 Peluang, pengali & RTP tiap taruhan rolet RPG + statistik pribadi | semua |
| `.rolet` | `roulette` `rouletterpg` `roletkoin` `rodarulet` `roletuang` `spinrolet` `roleteropa` | 🎡 Rolet RPG — roda Eropa 37 angka, taruhan uang RPG asli: merah/hitam, genap/ganjil, kecil/besar, lusin, kolom, atau angka langsung (×33) | semua |
| `.gamerespon` | `gameresponmenu` `respongame` `gamehub` `pusatgame` `menugame` `gameairichsemua` | 🧩 Hub semua game: Arcade HTML, Pastel HTML, Casino HTML (+ .slot uang RPG), Jadul HTML, dan Lab AI Rich | semua |
| `.gameresponlist` | `listgamerespon` `daftargamerespon` `listsemuagameairich` `gameresponsemua` | Daftar lengkap semua game dalam list interaktif (Arcade + Casino + Jadul + Lab) | semua |
| `.gameresponbaru` | `gamev74` `gamebaru74` `gamenew` `gamev75` `gamev76` `gamebaru76` | 27 game HTML app baru: 4 casino + 3 jadul (v7.4), 5 pastel (v7.5), 5 pastel + 5 arcade + 5 kasino RPG uang asli (v7.6) | semua |
| `.tebahewan` | `hewan` `tebakbinatang` | Tebak hewan dari ciri-cirinya | semua |
| `.asahotak` | `kuis` `quiz` `trivia` | Kuis pengetahuan umum | semua |
| `.batalgame` | `stopgame` `cancelgame` | Batalkan game yang sedang berjalan | semua |
| `.tebakkata` | `tebak_kata` | Tebak kata dari petunjuk | semua |
| `.tebakemoji` | `emoji` `tebakgambaremoji` | Tebak kata dari emoji | semua |
| `.family100` | `survey` | Jawab survey ala Family 100 | semua |
| `.gamemenu` | `games` `mingame` | Menu semua mini game | semua |
| `.tebakmatematika` | `mathquiz` `kuismat` `matematika` | Kuis hitung cepat (penjumlahan/pengurangan/perkalian) | semua |
| `.tebakprofesi` | `profesi` `tebakpekerjaan` | Tebak profesi dari deskripsi | semua |
| `.suit` | `rps` `batuguntingkertas` | Suit batu-gunting-kertas melawan bot | semua |
| `.tebakangka` | `guessnumber` | Tebak angka 1-100 dengan petunjuk | semua |
| `.tebakbendera` | `flag` | Tebak negara dari bendera | semua |
| `.tebakheroml` | `tebakml` `tebakhero` `mlquiz` | 🛡️ Tebak 1 dari 24 hero Mobile Legends dari gambar resminya (400 koin + 50 EXP) | semua |
| `.heroml` | `infohero` `mlhero` | Info + gambar resmi hero ML / daftar 24 hero | semua |
| `.tictactoe` | `ttt` `xo` | Tic-tac-toe lawan bot (kirim .ttt 1-9 untuk main) | semua |
| `.benarsalah` | `kuisbenar` `truesfalse` | Kuis benar/salah (5 pernyataan) | semua |
| `.kuissurah` | `quizzsurah` | Kuis: nama/arti/jumlah ayat surah Al-Quran | semua |
| `.kuisayat` | `tebakayat` | Kuis: nomor surah dari potongan informasi ayat | semua |
| `.kuisnegara` | `tebaknegara` | Kuis: nama negara dari petunjuk | semua |
| `.kuisibukota` | `tebakibukota` | Kuis: ibu kota sebuah negara | semua |
| `.kuisbendera` | `tebakkibendera2` | Kuis: tebak negara dari emoji bendera | semua |
| `.kuisuang` | `tebakmatauang` | Kuis: mata uang sebuah negara | semua |
| `.kuisbahasa` | `tebakbahasa` | Kuis: bahasa resmi sebuah negara | semua |
| `.kuisunsur` | `tebakunsur` | Kuis: nama unsur dari simbol kimia | semua |
| `.kuisatom` | `tebakatom` | Kuis: nomor atom sebuah unsur | semua |
| `.kuisgolongan` | `tebakgolongan` | Kuis: golongan unsur kimia | semua |
| `.kuisprovinsi` | `tebakprovinsi` | Kuis: ibu kota provinsi Indonesia | semua |
| `.kuisasmaul` | `tebakasmaul` | Kuis: arti Asmaul Husna | semua |
| `.kuisnabi` | `tebaknabi` | Kuis: kisah para nabi | semua |
| `.kuissingkatan` | `tebaksingkatan` | Kuis: kepanjangan singkatan | semua |
| `.kuislogika` | `tebaklogika` | Kuis: teka-teki logika | semua |
| `.kuishewan` | `tebakhewan2` | Kuis: dunia hewan | semua |
| `.kuisgunung` | `tebakgunung` | Kuis: gunung & pendakian | semua |
| `.kuislaut` | `tebaklaut` | Kuis: laut & samudra | semua |
| `.kuismakanan` | `tebakmakanan` | Kuis: kuliner nusantara | semua |
| `.kuissejarah` | `tebaksejarah` | Kuis: sejarah Indonesia & dunia | semua |
| `.kuisolahraga` | `tebakolahraga` | Kuis: dunia olahraga | semua |
| `.kuisfilm` | `tebakfilm` | Kuis: film & animasi | semua |
| `.kuislirik` | `tebaklirik` | Kuis: lengkapi lirik lagu | semua |
| `.kuisilmu` | `tebakilmu` | Kuis: sains & pengetahuan umum | semua |
| `.kuisgeografi` | `tebakgeografi` | Kuis: geografi dunia | semua |
| `.kuisaritmatika` | `hitungcepatkuis` | Kuis: hitung cepat (penjumlahan/perkalian) | semua |
| `.kuispecahan` | `tebakpecahan` | Kuis: pecahan & desimal | semua |
| `.kuisanagram` | `susunkata` | Kuis: susun huruf acak jadi kata | semua |
| `.kuiskode` | `tebakkode` | Kuis: output kode JavaScript sederhana | semua |
| `.gantungman` | `hangman` `tebakkatahuruf` | Hangman: tebak kata huruf demi huruf (6 nyawa) | semua |
| `.hitungcepat` | `speedmath` | Hitung cepat: 5 soal beruntun, skor + bonus waktu | semua |
| `.memoriangka` | `memorynumber` | Uji memori: hafal deret angka lalu tulis ulang | semua |
| `.kuisberuntun` | `paketkuis` `kuis5` | Paket 5 kuis campur semua kategori | semua |
| `.sambungkata` | `wordchain` | Sambung kata: kata baru harus diawali huruf terakhir kata sebelumnya | semua |
| `.tebakurutan` | `urutangka` | Urutkan 5 angka acak dari kecil ke besar | semua |
| `.batalgamelab` | `cancelab` `stopgamelab` | Batalkan game sesi khusus yang sedang berjalan | semua |
| `.daftargame` | `listgame` `semuagame` | Daftar semua game & kuis yang tersedia | semua |
| `.kuisacak` | `randomquiz` | Kuis acak dari semua kategori | semua |
| `.dadudouble` | `dadu2` `roll2` | Lempar 2 dadu sekaligus | semua |
| `.dadutiga` | `dadu3` `roll3` | Lempar 3 dadu (permainan Sic Bo sederhana) | semua |
| `.lemparkoin3` | `koin3` `flip3` | Lempar 3 koin sekaligus | semua |
| `.pilikartu` | `kartuacak` `drawcard` | Ambil 1 kartu dari dek remi 52 lembar | semua |
| `.roletgrup` | `randommember` `pilihmember` | Acak 1 member grup secara adil | semua |
| `.acakkata` | `kocokkata` `anagram` | Acak huruf sebuah kata (untuk tebak-tebakan) | semua |
| `.tebakkarakter` | `randomkarakter` `siapaaku` | Bot mendeskripsikan tokoh, kamu tebak | semua |
| `.bocoran` | `hint` `petunjuk` | Bocoran huruf untuk game "Siapa Aku?" | semua |
| `.kocoknama` | `acaknama` | Acak huruf namamu jadi nickname unik | semua |
| `.angkahoki2` | `hoki2` | Angka & warna hoki acak hari ini | semua |
| `.guntinggrup` | `rpsgrup` | Suit gunting-batu-kertas melawan bot (skor tersimpan) | semua |
| `.poujump` | `pou` `poulompat` `jumpou` `poujadul` `doodlejumpou` | Pou Jump — doodle-jump: ◀▶ geser Pou · ▲/● lompat turbo (3×, isi ulang tiap level) · ▼ terjun · hindari monster | semua |
| `.snakenokia` | `snakenokia3310` `nokiasnake` `snakejadul` `snakelcd` `ularnokia` | Snake Nokia 3310 — LCD monokrom: ▲▼◀▶ belok · ● mulai/ulang · 22×21 sel, makin cepat tiap 5 makanan | semua |
| `.spaceinvader` | `invaders` `spaceinvadersjadul` `tembakalien` `alienjadul` `invader` | Space Invader — ◀▶ geser kapal · ●/▲ tembak · habiskan 45 invader per wave sebelum mereka mendarat (3 nyawa) | semua |
| `.jadul` | `retro` `gamejadul` `jadulmenu` `retrogame` | Submenu 3 game jadul/retro HTML app (Pou Jump, Snake Nokia, Space Invader) | semua |
| `.jadullist` | `daftargamejadul` `listjadul` | Daftar 3 game jadul HTML app dalam bentuk list interaktif | semua |
| `.lbgame` | `papanperingkat` `rankinggame` `rankgame2` `peringkatgame` `topscore` `skortertinggi` `lbhtml` `papanrank` `leaderboardgame` | 🏆 Papan peringkat semua game sebagai kartu HTML app (medali, rank kamu, pilih game dengan ▲▼) — `.lbgame match3` / `.lbgame pastel` | semua |
| `.lbinfo` | `infolb` `caralb` `infoperingkat` `bantulb` `lbbantuan` | ℹ️ Cara kerja papan peringkat & kode setor skor | semua |
| `.lblist` | `lbteks` `daftarrank` `listleaderboard` `peringkatlist` `lbsemua` | 📜 Papan peringkat versi teks (semua game / satu game / satu kategori) — `.lblist match3` | semua |
| `.lbmenu` | `menulb` `menuleaderboard` `leaderboardmenu` `menupapan` `menuperingkat` | 🏆 Menu papan peringkat: kartu HTML, versi teks per game/kategori, peringkatmu, turnamen | semua |
| `.rankgame` | `skorku` `myscore` `statistikgame` `profilgame` `peringkatgamemu` `rankgameku` | 📊 Peringkat & skor terbaikmu di semua game + total setoran | semua |
| `.setorskore` | `skor` `simpanskor` `submitskor` `kodeskor` `setor` `kirimskor` `skorgame` `lbsetor` `setscore` | 📥 Setor skor dari kartu game ke papan peringkat — salin kode di bar 🏆 bawah kartu: `.setorskore 1a2-x9f3k` | semua |
| `.pancing` | `pancingikan` `mancingpastel` `fishpastel` `kailikan` `pancingpastel` | 🎣 Pancing Ikan — game pastel HTML app: pancing dari perahu: ◀▶ geser, ● turunkan/tarik kail, ▲▼ atur kedalaman · 🐟 +10 · ⭐ emas +50 · 🪼 ubur-ubur -1 nyawa · 3 nyawa, tempo naik | semua |
| `.ritme` | `irama` `ritmepastel` `rhythmgame` `pukulnot` `musikkotak` | 🎵 Irama Pastel — game pastel HTML app: rhythm 4 lajur: ◀ ▼ ▲ ▶ pukul not tepat di garis penilaian · Perfect/Good/Miss, kombo mengalikan poin · 60 detik, lagu makin rapat | semua |
| `.kartumemori` | `kartupasang` `memorygame` `pasangkartu` `memoripastel` `kartuingat` | 🧠 Kartu Memori — game pastel HTML app: cari 8 pasang kartu: ▲▼◀▶ pindah kursor, ● buka · salah pasang = kartu tertutup lagi · bonus poin makin cepat selesai | semua |
| `.donat` | `donatsusun` `susundonat` `stackdonat` `donatpastel` `tumpukdonat` | 🍩 Donat Susun — game pastel HTML app: tumpuk donat selaras: ● jatuhkan saat ayunan tepat · kelebihan dipotong · seimbang ±6px = SEMPURNA (donat melebar lagi) · ▲▼ atur kecepatan, ◀▶ balik arah | semua |
| `.susunhuruf` | `tebakhuruf` `katakeping` `acakhuruf` `susunhurufpastel` `kepinghuruf` | 🔤 Susun Kata — game pastel HTML app: susun kata Indonesia dari keping huruf acak: ◀▶ pilih keping, ● ambil, ▲ hapus, ▼ lewati (-1 nyawa) · 3 nyawa, kata makin panjang | semua |
| `.pastel2` | `pastelbaru` `pastelmenu2` `gamepastel2` `pastelv2` | Submenu 5 game pastel HTML app baru v7.6 (Pancing, Irama, Kartu Memori, Donat Susun, Susun Kata) | semua |
| `.pastellist2` | `daftarpastel2` `listpastel2` `pastelbaru2` | Daftar 10 game pastel HTML app (v7.5 + v7.6) dalam bentuk list interaktif | semua |
| `.bubble` | `balon` `balonsabun` `tembakbalon` `bubbleshooter` `soapbubble` | Balon Sabun — bubble shooter: ◀▶ bidik kasar, ▲▼ bidik halus, ● tembak · 3+ balon sewarna bersentuhan pecah · gugusan lepas ikut jatuh · tiap 8 tembakan langit-langit turun | semua |
| `.match3` | `permen` `permenpastel` `cocokpermen` `matchthree` `candypastel` | Permen Pastel — match-3: ▲▼◀▶ geser kursor · ● pilih lalu tukar dua permen bersebelahan · 3+ sewarna meletus, cascade = kombo berlipat · 25 langkah | semua |
| `.pinball` | `flipper` `pinballpastel` `bolapinball` `mesinpinball` `pinballcute` | Pinball Pastel — ● luncurkan bola · ◀ flipper kiri · ▶ flipper kanan · 3 bumper membal & memberi poin · 3 bola, jangan sampai jatuh ke lubang | semua |
| `.tikus` | `tikustanah` `whackamole` `pukultikus` `tikuslubang` `molepastel` | Tikus Tanah — whack-a-mole: ▲▼◀▶ pindah lubang · ● pukul · 🐹 +10 · ⭐ emas +50 · 💣 bom -1 nyawa · 60 detik, tempo naik tiap 8 detik | semua |
| `.pipa` | `pipabocor` `sambungpipa` `putarpipa` `airpipa` `pipepuzzle` | Pipa Bocor — puzzle: ▲▼◀▶ pindah sel · ● putar pipa 90° · alirkan air dari sumber kiri ke bintang kanan · tiap putaran memakan 1 langkah, anggaran disesuaikan tingkat kesulitan | semua |
| `.pastel` | `pastelmenu` `gamepastel` `kawaii` `pastelgame` | Submenu 10 game pastel HTML app (v7.5: Permen, Balon, Pinball, Tikus, Pipa · v7.6: Pancing, Irama, Kartu Memori, Donat, Susun Kata) | semua |
| `.pastellist` | `daftargamepastel` `listpastel` | Daftar 10 game pastel HTML app (v7.5 + v7.6) dalam bentuk list interaktif | semua |
| `.slot` | `mesinslot` `slotmesin` `putarslot` `slotgacor` `slotrpg` `slotkoin` `slotuang` `judislot` `spinrpg` `slotrpguang` | 🎰 Slot Mesin RPG — 3 gulungan HTML app, taruhan pakai uang RPG asli (koin), bisa diatur: .slot 500 / 2.5k / all / min | semua |
| `.slotbet` | `setbet` `taruhanslot` `betdefault` `slotdefault` | Atur taruhan bawaan .slot (tanpa memutar) — min 50, maks 250.000 | semua |
| `.slotinfo` | `infoslot` `paytable` `tabelslot` `hargaslot` `peluangslot` | Tabel hadiah, peluang (dihitung dari luck kamu), RTP, dan statistik slot RPG | semua |
| `.slotriwayat` | `riwayatslot` `historyslot` `slotlog` `logslot` | Riwayat 8 putaran slot RPG terakhir + untung/rugi tiap putaran | semua |
| `.kartuskor` | `eksporskor` `scorecard` `lbimage` `kartulb` `leaderboardimg` | 🖼 Ekspor leaderboard game ke GAMBAR (PNG siap tempel) — `.kartuskor snake` | semua |
| `.skorimg` | `kartuskorku` `skorcard` `myratingimg` `skorcardku` | 🪪 Kartu PNG peringkat milikmu di semua game yang kamu mainkan | semua |

---

## ⚔️ RPG Menu (150 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.berburu` | `hunt` `menambang` `mine` `memancing` `fish` `menebang` `chop` | Kumpulkan resource (butuh energi) | semua |
| `.battle` | `serang` `fight` `lawan` | Lawan monster (25 energi) | semua |
| `.rpg` | `petualang` `adventure` `game` | 🎮 Hub RPG — rpg 1 versi awal · rpg 2 versi perjalanan/misi/kerja · rpg 3 versi bisnis/sosial | semua |
| `.inv` | `inventory` `tas` `rpgprofile` `profilrpg` | Lihat inventory & profil RPG | semua |
| `.jual` | `sell` `equip` `unequip` `heal` `makan` `eat` `gunakan` | Jual item, equip alat, heal, makan | semua |
| `.monster` | `bestiary` `listmonster` | Daftar monster & syarat level | semua |
| `.rpglb` | `rpgleaderboard` `toprpg` | Peringkat level RPG tertinggi | semua |
| `.rpgmenu1` | `rpg1` `rpgawal` `menurpg1` | 🗿 RPG versi awal — hub klasik (berburu, battle, toko, item, slot RPG) | semua |
| `.toko` | `shop` `beli` `buy` | Beli peralatan, ramuan, makanan | semua |
| `.transfer` | `tf` `kirimkoin` `beri` | Transfer koin ke user lain | semua |
| `.belibisnis` | `buybisnis` `beliusaha` `bisnisbeli` `openbisnis` | 🏬 Beli usaha pasif — `.belibisnis warung` (uang dipotong dari RPG) | semua |
| `.bisnis` | `usaha` `mybusiness` `bisnisku` `usahaku` | 🏪 Dashboard bisnis pasif kamu (uang = uang RPG) + toko usaha | semua |
| `.koleksibisnis` | `klaimbisnis` `collectbisnis` `panenbisnis` `takebisnis` | 💰 Klaim pendapatan semua bisnis yang terkumpul (per jam, maks akum. 8 jam) | semua |
| `.upgradebisnis` | `naikbisnis` `upgradeusaha` `upbisnis` `growthbisnis` | ⬆️ Upgrade usaha (pendapatan × level) — `.upgradebisnis kopira` | semua |
| `.jualbisnis` | `sellbisnis` `jualusaha` `bisnisjual` `closebisnis` | 💸 Jual balik usaha (60% modal terkumpul) — `.jualbisnis kopira` | semua |
| `.rpgmenu3` | `rpg3` `rpgbisnismode` `rpgbiznis` | 🏪 RPG versi bisnis/sosial — usaha pasif, transfer ekonomi, profil sosial | semua |
| `.kerja` | `work` `bekerja` `shift` `ngantor` | 💼 Kerja sesuai profesi → koin + EXP (16 profesi, cooldown 30 menit, naik pangkat tiap 5 shift) | semua |
| `.kerjainfo` | `infokerja` `daftarkerja` `listprofesi` `pekerjaan` `daftarprofesi` | ℹ️ Daftar 16 profesi: syarat level, energi, gaji, item sampingan & sistem pangkat | semua |
| `.gajian` | `riwayatkerja` `slipgaji` `gajiku` | 🧾 Riwayat 20 shift terakhir & total gaji seumur akun | semua |
| `.resign` | `berhentikerja` `keluarkerja` | 🚪 Berhenti dari profesi sekarang (pangkat & shift direset, riwayat tetap) | semua |
| `.rpgmenu2` | `rpglengkap` `rpgfull` | Menu RPG lengkap (semua sistem) | semua |
| `.rpgkartu` | `karturpg` `rpgcard` | Kartu profil RPG bergambar (sesuai level & lokasi) | semua |
| `.rpgstat` | `statistikrpg` `statrpg` | Rincian Attack/Defense/Luck & sumber bonusnya | semua |
| `.rpgriwayat` | `logrpg` `riwayatrpg` | 20 aktivitas RPG terakhir kamu | semua |
| `.rpgbantuan` | `panduanrpg` `caramainrpg` | Panduan lengkap sistem RPG & kaitannya | semua |
| `.rpgreset` | `resetrpg` `ulangrpg` | Reset data RPG kamu (perlu konfirmasi) | semua |
| `.petku` | `petstatus` `lihatpet` | Status pet kamu saat ini | semua |
| `.pettelur` | `belitelur` `belipet` | Beli telur pet (5.000 koin) | semua |
| `.tetaskan` | `hatch` `tetaskantelur` | Tetaskan telur jadi pet acak | semua |
| `.petmakan` | `feedpet` `kasihmakanpet` | Beri makan pet (butuh 🍖 Makanan Pet) | semua |
| `.petlatih` | `trainpet` `latihpet` | Latih pet: naikkan skill & EXP (10 energi) | semua |
| `.petguide` | `daftarspesies` `petlist` | Daftar semua spesies pet & bonusnya | semua |
| `.petlepas` | `releasepet` `bebaskanpet` | Lepaskan pet (dapat kompensasi koin) | semua |
| `.petkartu` | `kartupet` `petcard` | Kartu gambar pet kamu | semua |
| `.petgantinama` | `renampet` `namapet` | Ganti nama panggilan pet | semua |
| `.belibibit` | `beliseed` `bibit` | Beli bibit tanaman (150 koin) | semua |
| `.tanam` | `plant` `berkebun` | Tanam bibit di kebun (5 energi, 15 menit) | semua |
| `.sirami` | `water` `siram` | Siram tanaman: percepat 3 menit (2 energi) | semua |
| `.panen` | `harvest` `panenkebun` | Panen hasil kebun | semua |
| `.kebunku` | `farmku` `statuskebun` | Status kebun & hasil panen | semua |
| `.dungeoninfo` | `listdungeon` `dungeon` | Daftar dungeon & persyaratannya | semua |
| `.masukdungeon` | `dungeonrun` `jelajahdungeon` | Masuk dungeon: .masukdungeon <id> | semua |
| `.dungeonlb` | `leaderboarddungeon` `topdungeon` | Peringkat penakluk dungeon | semua |
| `.dungeonpersiapan` | `cekdungeon` `siapdungeon` | Cek kesiapan kamu masuk dungeon | semua |
| `.misi` | `quest` `misiharian` | Misi harian: 3 tugas + hadiah | semua |
| `.misiklaim` | `klaimmisi` `claimquest` | Klaim hadiah misi: .misiklaim <id\|semua> | semua |
| `.misistatus` | `misicek` `cekquest` | Cek cepat progres misi tanpa kartu | semua |
| `.resep` | `daftarresep` `craftlist` | Semua resep crafting + bahan yang kamu punya | semua |
| `.craft` | `buatitem` `membuat` | Craft item dari bahan: .craft <nama> | semua |
| `.tempa` | `forge` `upgrade` | Tempa peralatan yang dipakai (+4% per level, maks +10) | semua |
| `.tempalist` | `bonustempa` `tabeltempa` | Tabel bonus & peluang penempaan | semua |
| `.arena` | `pvp` `duel` | Duel PvP dengan user lain: .arena @user [taruhan] | semua |
| `.arenarekam` | `rekorarena` `statistikarena` | Rekor duel arena kamu | semua |
| `.arenalb` | `papanarena` `toparena` | Papan peringkat duel arena | semua |
| `.tarung` | `byone` `duelturn` `tarungpvp` `tantangduel` | ⚔️ Duel PvP turn-based: .tarung @user [taruhan], aksi: duelterima/dueltolak/duelserang/duelheal/duelkabur/duelinfo | semua |
| `.peti` | `bukapeti` | 🎁 Peti hoki harian (gratis 1×/hari) | semua |
| `.bank` | `setorbank` `deposit` | Setor koin ke bank (aman + bunga 1%/hari) | semua |
| `.tarikbank` | `withdraw` `ambilbank` | Tarik koin dari bank | semua |
| `.bankinfo` | `infobank` `cekbank` | Saldo, bunga, & riwayat bank | semua |
| `.peta` | `map` `petarpg` | Peta lokasi jelajah & status terbuka | semua |
| `.jelajah` | `explore` `eksplorasi` | Jelajahi lokasi: .jelajah <id lokasi> | semua |
| `.lokasiinfo` | `infolokasi` `detaillokasi` | Detail satu lokasi: .lokasiinfo <id> | semua |
| `.pencapaian` | `achievement` `prestasi` | Daftar prestasi & progresnya | semua |
| `.klaimpencapaian` | `klaimprestasi` `claimachievement` | Klaim hadiah prestasi | semua |
| `.gelar` | `titlerpg` `daftargelar` | Daftar gelar yang bisa dipakai | semua |
| `.setgelar` | `pasanggelar` `pakaigelar` | Pasang gelar: .setgelar <nama gelar> | semua |
| `.tokopet` | `petshop` `tokohewan` | Toko pet: telur, makanan | semua |
| `.tokoalat` | `blacksmith` `tokosenjata` | Toko alat & senjata tingkat tinggi | semua |
| `.tokoramuan` | `apotek` `tokoobat` | Toko ramuan & makanan pemulihan | semua |
| `.pasarjual` | `jualsemua` `jualmassal` | Jual semua resource makanan/tambang sekaligus | semua |
| `.tokokartu` | `kartutoko` `shopcard` | Kartu gambar ringkasan semua toko | semua |
| `.invkartu` | `kartuinv` `kartutas` | Kartu gambar inventory + nilai total | semua |
| `.misikartu` | `kartumisi` `questcard` | Kartu gambar misi harian | semua |
| `.worldboss` | `bosdunia` `bossdunia` `wboss` | Status world boss (HP bersama semua pemain) | semua |
| `.serangboss` | `attackboss` `hitboss` `pukulboss` | Serang world boss (30 energi, cooldown 2 menit) | semua |
| `.bossrank` | `rankboss` `peringatanboss` `kontribusiboss` | Peringkat kontribusi world boss | semua |
| `.bosshadiah` | `klaimboss` `rewardboss` `hadiahboss` | Klaim hadiah world boss (setelah tumbang) | semua |
| `.bossinfo` | `listboss` `daftarbos` `infoboss` | Daftar semua world boss & syaratnya | semua |
| `.bosskartu` | `kartuboss` `kartuworldboss` | Kartu gambar world boss | semua |
| `.bosshiwayat` | `riwayatboss` `historyboss` `bosskalah` | Riwayat world boss yang sudah dikalahkan | semua |
| `.jobinfo` | `daftarjob` `listjob` `kelasinfo` | Daftar 6 kelas/job RPG + bonus & syaratnya | semua |
| `.pilihjob` | `ambiljob` `setjob` `jadikelas` | Pilih kelas/job karakter (sekali, gratis) | semua |
| `.jobku` | `kelasaku` `jobstatus` | Lihat kelas, skill aktif, dan statistik turunan | semua |
| `.gantijob` | `ubahjob` `pindahjob` `respecjob` | Ganti kelas (biaya 5.000 koin) | semua |
| `.skilljob` | `pakaiskilljob` `jobskill` `skillkhusus` | Pakai skill khusus kelasmu (cooldown 10 menit) | semua |
| `.buffku` | `lihatbuff` `efekaku` `daftarbuff` | Lihat buff aktif & sisa waktunya | semua |
| `.jobkartu` | `kartujob` `kartukelas` | Kartu gambar kelasmu (tema menyesuaikan) | semua |
| `.joblb` | `leaderboardjob` `topjob` `rankjob` | Peringkat pemain per kelas | semua |
| `.skill` | `skilltree` `pohonskill` `skillku` | Lihat pohon skill (12 skill, 3 cabang) & poin | semua |
| `.belajarskill` | `ambilskill` `upgradeskill` `pelajariskill` | Pelajari satu skill pakai poin | semua |
| `.skillinfo` | `infoskill` `rincianskill` | Rincian satu skill | semua |
| `.resetskill` | `hapusskill` `refundskill` `respec` | Reset semua skill (poin kembali, biaya 3.000 koin) | semua |
| `.poinskill` | `cekpoin` `poinskillku` | Cek poin skill & cara menambahnya | semua |
| `.skillkartu` | `kartuskill` `kartupohon` | Kartu gambar pohon skill & poin | semua |
| `.buatguild` | `createguild` `binguild` `dirikanguild` | Dirikan guild (25.000 koin, Lv.5+) | semua |
| `.joinguild` | `masukkanguild` `gabungguild` `enterguild` | Gabung guild yang sudah ada | semua |
| `.guildku` | `guildsaya` `infoguildku` `guild` | Info guild tempat kamu bernaung | semua |
| `.guildinfo` | `cekguild` `guildcari` `cariguild` | Cari info guild berdasarkan nama | semua |
| `.guildanggota` | `listanggota` `memberguild` `anggotaguild` | Daftar anggota guild + kontribusi | semua |
| `.guilddonasi` | `donasiguild` `sumbangguild` `donateguild` | Donasi koin ke bendahara guild | semua |
| `.guildmisi` | `misiguild` `tugasguild` `questguild` | Progres misi mingguan guild | semua |
| `.guildklaim` | `klaimmisiguild` `hadiahguild` `claimguild` | Klaim hadiah misi mingguan guild | semua |
| `.guildkeluar` | `leaveguild` `keluarguild` `quitguild` | Keluar dari guild | semua |
| `.guildbubar` | `hapussguild` `dissolveguild` `bubarkanguild` | Bubarkan guild (hanya pemimpin) | semua |
| `.guildlb` | `leaderboardguild` `topguild` `rankguild` | Peringkat guild (level, anggota, bendahara) | semua |
| `.guildkartu` | `kartuguild` `kartuklan` | Kartu gambar guild (tema kastil) | semua |
| `.rpgmenu4` | `rpgv7` `menurpgv7` `rpglanjutan` `rpg4` | Menu RPG v7: job, skill, guild, world boss | semua |
| `.marketjual` | `jualmarket` `pasangjualan` `bukaanlapak` | Jual item ke market antar pemain | semua |
| `.marketbuka` | `bukamarket` `pasarv7` `belanjaonline` | Lihat semua item yang dijual pemain lain | semua |
| `.marketbeli` | `belimarket` `ordermarket` | Beli barang dari market | semua |
| `.marketbatal` | `batallapak` `hapusjualan` `tarikmarket` | Batalkan lapak & ambil kembali item | semua |
| `.marketsaya` | `lapakku` `jualanku` `mylisting` | Lihat lapak aktif & riwayat penjualanmu | semua |
| `.marketharga` | `hargapasar` `cekharga` `pricehistory` | Rata-rata harga item di market (10 transaksi terakhir) | semua |
| `.marketkartu` | `kartumarket` `kartupasar` | Kartu gambar market + barang termurah | semua |
| `.resepmasakan` | `daftarresep7` `resepbuf` `resepmasakanv7` | Daftar 12 resep masakan/alkimia + efek buff | semua |
| `.masak` | `memaksak` `cooking` `olahmakanan` | Masak resep (butuh bahan dari kebun/peternakan) | semua |
| `.makanbuff` | `pakaimasakan` `gunakanbuff` `eatbuff` | Makan masakan → dapat efek/buff | semua |
| `.alkimia` | `racikramuan` `brewpotion` `buatramuan` | Racik ramuan tempur (butuh herbal & bijih) | semua |
| `.masakaninfo` | `infomasakan` `simpananmakanan` `dapurku` | Lihat simpanan masakan & buff aktif | semua |
| `.masakkartu` | `kartumasak` `kartudapur` `buffkartu` | Kartu gambar dapur/masakan | semua |
| `.permata` | `daftargem` `gems` `listpermata` | Lihat permata yang dimiliki & yang terpasang | semua |
| `.pasangpermata` | `socketgem` `pasanggem` `gemsocket` | Pasang permata ke senjata/armor | semua |
| `.lepaspermata` | `cabutgem` `lepasgem` `gemout` | Lepas permata dari slot | semua |
| `.caripermata` | `tambangpermata` `burugem` `mininggem` | Buru permata (25 energi, hasil tergantung luck) | semua |
| `.belihewan` | `beliternak` `adopthewan` `belibinatang` | Beli hewan ternak (produksi ber-timer) | semua |
| `.kandangku` | `ternakku` `hewanku` `peternakan` | Lihat semua hewan & status produksinya | semua |
| `.panenhewan` | `panenternak` `ambiltelur` `perahsusu` | Panen hasil semua hewan yang siap | semua |
| `.berimakan` | `pakanhewan` `feedhewan` `kasihmakan` | Beri pakan → produksi 25% lebih cepat (6 jam) | semua |
| `.hewaninfo` | `infohewan` `detailhewan` `ternakinfo` | Rincian satu jenis hewan ternak | semua |
| `.jualhewan` | `lepashewan` `jualternak` | Jual hewan ternak (70% harga beli) | semua |
| `.belirumah` | `belihouse` `beliproperti` | Beli rumah (bonus regen energi & koin) | semua |
| `.rumahku` | `rumahsaya` `myhouse` `propertiku` | Lihat rumah, dekorasi, dan bonusnya | semua |
| `.upgraderumah` | `naikkanrumah` `renovasi` | Upgrade rumah ke tingkat berikutnya | semua |
| `.belidekor` | `belidekorasi` `shopdekor` | Beli dekorasi rumah (bonus pasif kecil) | semua |
| `.dekorasi` | `lihatdekor` `listdekorasi` | Lihat dekorasi terpasang & efeknya | semua |
| `.rumahkartu` | `karturumah` `kartuproperti` | Kartu gambar rumahmu | semua |
| `.relik` | `relic` `daftarrelik` `artefak` | Lihat relik yang dimiliki & yang dipakai | semua |
| `.carirelik` | `bururelik` `huntrelic` `ekspedisirelik` | Ekspedisi mencari relik (60 energi, Lv.8+) | semua |
| `.pasangrelik` | `pakairelik` `equiprelik` `setrelik` | Pasang/ganti relik yang dipakai | semua |
| `.inforelik` | `detailrelik` `relikinfo` | Rincian satu relik | semua |
| `.musim` | `season` `cuacarpg` `musimrpg` | Musim RPG saat ini & efeknya ke seluruh server | semua |
| `.musimbantuan` | `panduanmusim` `seasonhelp` | Penjelasan sistem musim & strategi | semua |
| `.rebirthinfo` | `prestigeinfo` `informasirebirth` `rebirthhelp` | Penjelasan rebirth (prestige) & bonusnya | semua |
| `.rebirth` | `prestige` `lahirkembali` `resetlevel` | Rebirth: reset level demi pengali permanen (Lv.20+) | semua |
| `.rebirthkartu` | `karturebirth` `kartuprestige` | Kartu gambar status rebirth | semua |
| `.hadiahharian` | `dailyv7` `klaimharian` `loginharian` | Hadiah harian (streak 7 hari, makin lama makin besar) | semua |
| `.streakku` | `cekstreak` `streaklogin` `absenrpg` | Lihat streak harian & kalender hadiah | semua |
| `.streaklb` | `leaderboardstreak` `topstreak` `rankstreak` | Peringkat streak harian pemain | semua |
| `.turnamenv7` | `arenamingguan` `kompetisi` `turnamenrpg` | Turnamen mingguan: adu statistik karakter | semua |
| `.ikutturnamen` | `daftartertunamen` `jointurnamen` `turnamendaftar` | Daftar turnamen mingguan (2.000 koin) | semua |
| `.turnamenlb` | `leaderboardturnamen` `rankturnamen` `hasiltertunamen` | Peringkat & pemenang turnamen (minggu ini + arsip) | semua |
| `.kartuv7` | `rpgkartuv7` `kartulengkap` `kartuv7lengkap` | Kartu rangkuman semua sistem RPG v7 | semua |

---

## 🛠️ Tools (112 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.airichtabel` | `tabelairich` `buattabelairich` `airichtable` | Ubah teks jadi tabel AI Rich (pisahkan kolom dengan "\|", baris dengan ";") | semua |
| `.airichkode` | `kodeairich` `airichcode` `snippetairich` | Tampilkan snippet kode sebagai blok kode AI Rich | semua |
| `.toimg` | `toimage` `sticker2img` `tofoto` | Ubah stiker jadi gambar/foto | semua |
| `.fancy` | `style` `fancytext` `gaya` | Ubah teks jadi berbagai gaya font | semua |
| `.getpp` | `pp` `profilepic` | Ambil foto profil (tag/reply, default: kamu) | semua |
| `.nowa` | `cekwa` `onwa` | Cek apakah nomor terdaftar di WhatsApp | semua |
| `.jadwalkan` | `remindme` `jadwalkansaya` `ingatpada` `schedulemsg` `jadwalpesan` | ⏰ Jadwalkan pesan pengingat (WIB): `.jadwalkan 30 menit bayar utang` · `.jadwalkan 17:30 jumatan` · `.jadwalkan harian 07:00 morning routine` | semua |
| `.rvo` | `readviewonce` `bukavo` `lihatvo` `viewonce` | 🔓 Buka pesan foto/video sekali-lihat (view-once) → dikirim balik utuh | semua |
| `.removebg` | `rbg` `hapuslatar` `nobg` `rimbg` `remove-background` `bgremover` | 🖼 Hapus background foto (AI) — balas foto lalu `.removebg` | semua |
| `.hd` | `tohd` `upscale` `perjelas` `hdpic` `superres` | 🔍 Perjelas foto jadi HD 4x — balas foto lalu `.hd` | semua |
| `.hdvid` | `tohdvid` `hdvideo` `perjelasvideo` `videohd` | 🎞 Perjelas video (best-effort via API) — balas video MP4 lalu `.hdvid` | semua |
| `.jadihitam` | `jadigelap` `blackfilter` `bwfilter` `filterhitam` | 🖤 Edit foto "jadi hitam" ala filter aesthetic — balas foto lalu `.jadihitam` | semua |
| `.base32` | `b32` | Encode teks ke Base32 | semua |
| `.base32dec` | `b32dec` | Decode Base32 ke teks | semua |
| `.base58` | `b58` | Encode teks ke Base58 | semua |
| `.base58dec` | `b58dec` | Decode Base58 ke teks | semua |
| `.base64url` | `b64url` | Encode Base64 URL-safe | semua |
| `.base64urldec` | `b64urldec` | Decode Base64 URL-safe | semua |
| `.text2hex` | `hexify` | Encode teks ke hexadecimal | semua |
| `.hex2text` | `unhexify` | Decode hexadecimal ke teks | semua |
| `.text2biner` | `binerteks` | Ubah teks ke biner | semua |
| `.biner2text` | `teksbiner` | Ubah biner ke teks | semua |
| `.text2oktal` | `oktalteks` | Ubah teks ke oktal | semua |
| `.encurl` | `urlencode2` | URL-encode teks | semua |
| `.decurl` | `urldecode2` | URL-decode teks | semua |
| `.htmlentity` | `htmlenc` | Ubah teks ke HTML entity | semua |
| `.htmlunescape` | `htmldec` | Ubah HTML entity ke teks | semua |
| `.unicode` | `codepoint` | Tampilkan code point Unicode tiap karakter | semua |
| `.rotsandi` | - | Cipher ROT13 | semua |
| `.rot47` | - | Cipher ROT47 | semua |
| `.atbash` | - | Cipher Atbash (cermin alfabet) | semua |
| `.caesarshift` | `sandishift` | Cipher Caesar: .caesar <geser> <teks> | semua |
| `.vigenere` | - | Cipher Vigenère: .vigenere <kunci> <teks> | semua |
| `.morsetotext` | `morseteks` | Decode morse ke teks | semua |
| `.leetify` | `leet1337` | Ubah teks jadi leetspeak | semua |
| `.md5` | - | Hash MD5 | semua |
| `.sha1` | - | Hash SHA-1 | semua |
| `.sha256` | - | Hash SHA-256 | semua |
| `.sha512` | - | Hash SHA-512 | semua |
| `.sha3` | - | Hash SHA3-256 | semua |
| `.crc32` | - | Checksum CRC32 | semua |
| `.hmacsha` | `hmac` | HMAC-SHA256: .hmacsha <kunci> <teks> | semua |
| `.camelcaseify` | `camelize` | Ubah ke camelCase | semua |
| `.pascalcaseify` | `pascalize` | Ubah ke PascalCase | semua |
| `.snakecaseify` | `snakeize` | Ubah ke snake_case | semua |
| `.kebabcaseify` | `kebabize` | Ubah ke kebab-case | semua |
| `.constantcase` | `screaming` | Ubah ke CONSTANT_CASE | semua |
| `.titlecaseify` | `titleize` | Ubah ke Title Case | semua |
| `.sentencecase` | `sentence` | Ubah ke Sentence case | semua |
| `.alternating` | `altcase` `spongebob` | Ubah ke KaPiTaL sELeNg-SeLiNg | semua |
| `.inverse` | `invertcase` | Balik besar/kecil huruf | semua |
| `.balikteks` | `teksbalik` | Balik urutan karakter | semua |
| `.reversword` | `balikkata` | Balik urutan kata | semua |
| `.slugifyteks` | `bikinslug` | Ubah teks jadi slug URL | semua |
| `.wordcount` | `hitungkata` `statteks` | Statistik teks (kata, karakter, baris, kalimat) | semua |
| `.dedupe` | `barisunik` `hapusduplikat` | Hapus baris duplikat | semua |
| `.sortline` | `urutbaris` | Urutkan baris (asc/desc) | semua |
| `.striphtml` | `hapushtml` | Buang tag HTML dari teks | semua |
| `.emojiinfo` | `hitungemoji` | Hitung & daftar emoji dalam teks | semua |
| `.terbilang` | `bilangangka` | Ubah angka jadi kata (terbilang) | semua |
| `.romawi` | `toroman` `roman` | Ubah angka ke Romawi | semua |
| `.romawidec` | `fromroman` | Ubah Romawi ke angka | semua |
| `.primacheck` | `cekprima` `prima` | Cek bilangan prima | semua |
| `.faktorisasi` | `faktorialprima` | Faktorisasi prima | semua |
| `.fpb` | `gcd` | FPB (GCD) dua angka: .fpb 12 18 | semua |
| `.kpk` | `lcm` | KPK (LCM) dua angka: .kpk 4 6 | semua |
| `.fibonacci` | `fibo` | Deret Fibonacci ke-n / sebanyak n | semua |
| `.faktorial` | `factorial` | Hitung faktorial n! | semua |
| `.baseconvert` | `konversibase` | Konversi antar basis: .baseconvert 255 16 | semua |
| `.bmi` | `imt` | Hitung BMI: .bmi <kg> <cm> | semua |
| `.persen` | `percentage` | Hitung persentase: .persen 25 dari 200 | semua |
| `.suhu` | `konversisuhu` `celcius` | Konversi suhu: .suhu 30 C | semua |
| `.jsonformat` | `jsonpretty` `formatjson` | Rapikan JSON | semua |
| `.jsonminify` | `minifyjson` | Padatkan JSON | semua |
| `.csv2json` | `csvjson` | Ubah CSV ke JSON (baris pertama = header) | semua |
| `.jwtdecode` | `jwt` | Decode token JWT (header + payload) | semua |
| `.uuid` | `guid` | Buat UUID v4 | semua |
| `.password` | `genpass` `buatpassword` | Buat password acak: .password [panjang] | semua |
| `.username` | `genuser` `namauser` | Buat ide username acak | semua |
| `.angkaacak` | `randomnumber` `acakangka` | Angka acak: .angkaacak [min] [max] | semua |
| `.pilihacak` | `randompick2` `undipilih` | Pilih acak dari daftar (pisah koma) | semua |
| `.warnahex` | `hex2rgb` `konversiwarna` | Konversi warna hex → RGB/HSL | semua |
| `.timestamp` | `unixtime` `waktuts` | Konversi timestamp ↔ tanggal | semua |
| `.hitungumur` | `umurku2` `agex` | Hitung umur dari tanggal lahir | semua |
| `.selisihhari` | `datediff` `jaraktanggal` | Selisih dua tanggal: .selisihhari 2026-01-01 2026-12-31 | semua |
| `.hitungmundur` | `countdown` | Hitung mundur ke tanggal tertentu | semua |
| `.base64dec` | `b64decode` `unbase64` | Decode Base64 ke teks | semua |
| `.binary` | `biner` `binenc` | Ubah teks ke biner | semua |
| `.binarydec` | `bindec` `unbiner` | Ubah biner ke teks | semua |
| `.caesar` | `caesarcipher` | Cipher Caesar (format: shift\|teks) | semua |
| `.rapikan` | `collapsespace` `buangspasi` | Rapikan spasi berlebih | semua |
| `.hashtag` | `tagar` | Ubah teks jadi hashtag | semua |
| `.hexdec` | `unhex` | Ubah hexadesimal ke teks | semua |
| `.leet` | `leetspeak` `1337` | Ubah teks jadi gaya 1337 | semua |
| `.lowercase` | `kecil` `lower` | Ubah teks jadi huruf kecil | semua |
| `.morse` | `morseenc` | Ubah teks ke kode Morse | semua |
| `.morsedec` | `unmorse` | Ubah kode Morse ke teks | semua |
| `.nospace` | `hspasi` `tanpaspace` | Hapus semua spasi | semua |
| `.palindrome` | `cekpalindrom` | Cek apakah teks palindrom | semua |
| `.repeat` | `ulang` | Ulangi teks N kali (format: n\|teks) | semua |
| `.rot13` | - | Cipher ROT13 | semua |
| `.slug` | `slugify` | Ubah teks jadi slug url | semua |
| `.sortwords` | `urutkata` | Urutkan kata secara alfabet | semua |
| `.titlecase` | `kapitalawal` `title` | Kapital Di Awal Kata | semua |
| `.uniquewords` | `unikata` | Buang kata duplikat | semua |
| `.uppercase` | `kapital` `upper` `besar` | Ubah teks jadi HURUF BESAR | semua |
| `.urldecode` | `urldec` | Decode format URL ke teks | semua |
| `.urlencode` | `urlenc` | Encode teks jadi format URL | semua |
| `.base64` | `hex` `b64` `encode` `decode` `reverse` `hitung` `calc` | Encode/decode teks & kalkulator | semua |
| `.qrcode` | `qr` `buatqr` | Buat QR code dari teks/link | semua |
| `.readmore` | `rm` | Buat teks tersembunyi (readmore) | semua |
| `.tourl` | `upload` `tolink` | Upload media jadi link (reply/kirim media) | semua |

---

## 🕌 Islami (96 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.sholat` | `jadwalsholat` `waktusholat` `jadwalshalat` `sholat5waktu` | Jadwal sholat 5 waktu + imsak (Kemenag RI) per kota | semua |
| `.kiblat` | `arahkiblat` `qibla` | Arah kiblat dari kota tertentu (derajat dari utara) | semua |
| `.asmaulhusna` | `asmaul` `asmaallah` `99nama` | Asmaul Husna acak / nomor tertentu (.asmaul 55) | semua |
| `.ayat` | `ayatalquran` `verse` | Satu ayat + terjemahan (format 2:255) | semua |
| `.quran` | `bacaquran` `bacasurah` | Baca satu surah penuh (arab + terjemahan) | semua |
| `.iduladha` | `qurban` `countdownqurban` `hajiraya` | Hitung mundur menuju 10 Zulhijah (Idul Adha) | semua |
| `.lebaran` | `idulfitri` `idulfitiri` `countdownlebaran` | Hitung mundur menuju 1 Syawal (Idul Fitri) | semua |
| `.maulid` | `maulidnabi` `countdownmaulid` | Hitung mundur menuju 12 Rabiul Awal (Maulid Nabi) | semua |
| `.ramadhan` | `countdownramadhan` `puasaramadhan` `hitungramadhan` | Hitung mundur menuju 1 Ramadan | semua |
| `.tahunbaruislam` | `1muharram` `muharram` | Hitung mundur menuju 1 Muharram (Tahun Baru Islam) | semua |
| `.daftarasmaulhusna` | `asmaulall` `listasmaul` | Daftar lengkap 99 Asmaul Husna + arti Indonesia | semua |
| `.daftarhadits` | `listhadits` `haditslist` | Daftar 42 judul hadits Arbain Nawawi | semua |
| `.surah` | `daftarsurah` `listsurah` `surat` | Daftar 114 surah / detail satu surah (.surah 18) | semua |
| `.doa` | `caridoа` `caridoa` `doapencarian` | Cari 443 doa (.doa rezeki / .doa untuk orang sakit) | semua |
| `.doaharian` | `doaseharihari` `doapopuler` | 27 doa harian (makan, tidur, keluar rumah, dll) + detail per nomor | semua |
| `.doakategori` | `kategoridoa` `listdoa` | Daftar 29 kategori doa (.doakategori travel) | semua |
| `.dzikir` | `zikir` `dzikirlist` | Panduan dzikir (setelah sholat, pagi, petang) + tasbih counter | semua |
| `.dzikirpagi` | `zikirpagi` | Panduan dzikir pagi | semua |
| `.dzikirpetang` | `zikirpetang` | Panduan dzikir petang | semua |
| `.dzikirshalat` | `dzikirsholat` `dzikirsetelahsholat` `wirid` | Bacaan dzikir setelah sholat fardhu + jumlah hitungannya | semua |
| `.hadits` | `hadis` `haditsarbain` `arbain` | Hadits Arbain Nawawi acak / per nomor (.hadits 5) | semua |
| `.hijriah` | `tanggalhijriah` `hijri` `kalenderhijriah` | Tanggal Hijriah hari ini + puasa sunnah yang dianjurkan | semua |
| `.istighfar` | `sholawat` `tahlil` | Hitung dzikir tertentu: .istighfar 100 / .sholawat 50 | semua |
| `.hijrike` | `gtohijri` `masehikehijri` `tomasehi` | Konversi tanggal Masehi → Hijriah (dd-mm-yyyy) | semua |
| `.masehike` | `htog` `hijritomasehi` `kemasehi` | Konversi tanggal Hijriah → Masehi (dd-mm-yyyy) | semua |
| `.menuislami` | `islami` `islam` | Menu lengkap fitur Islami | semua |
| `.nabi` | `rasul` `kisahnabi` `25nabi` | Daftar 25 Nabi & Rasul / kisah satu nabi (.nabi musa) | semua |
| `.niat` | `bacaanniat` | Niat ibadah (wudhu, tayamum, mandi, sholat, puasa, zakat, kurban) | semua |
| `.niatwudhu` | - | Niat Wudhu | semua |
| `.niattayamum` | - | Niat Tayamum | semua |
| `.niatmandi` | - | Niat Mandi Wajib (Junub) | semua |
| `.niatmandiwajib` | - | Niat Mandi Wajib (Junub) | semua |
| `.niatmandijunub` | - | Niat Mandi Wajib (Junub) | semua |
| `.niatsholatsubuh` | - | Niat Sholat Subuh | semua |
| `.niatsholatdzuhur` | - | Niat Sholat Dzuhur | semua |
| `.niatsholatasar` | - | Niat Sholat Ashar | semua |
| `.niatsholatmaghrib` | - | Niat Sholat Maghrib | semua |
| `.niatsholatisya` | - | Niat Sholat Isya | semua |
| `.niatsholatjumat` | - | Niat Sholat Jumat (makmum) | semua |
| `.niatdhuha` | - | Niat Sholat Dhuha | semua |
| `.niattahajud` | - | Niat Sholat Tahajud | semua |
| `.niatwitir` | - | Niat Sholat Witir | semua |
| `.niattarawih` | - | Niat Sholat Tarawih (makmum) | semua |
| `.niatpuasa` | - | Niat Puasa Ramadan | semua |
| `.niatpuasaramadhan` | - | Niat Puasa Ramadan | semua |
| `.niatpuasasenin` | - | Niat Puasa Senin | semua |
| `.niatpuasakamis` | - | Niat Puasa Kamis | semua |
| `.niatpuasaqadha` | - | Niat Puasa Qadha Ramadan | semua |
| `.niatpuasaayyamulbidh` | - | Niat Puasa Senin | semua |
| `.niatbuka` | - | Doa Berbuka Puasa | semua |
| `.doabuka` | - | Doa Berbuka Puasa | semua |
| `.doabukapuasa` | - | Doa Berbuka Puasa | semua |
| `.niatzakatfitrah` | - | Niat Zakat Fitrah (untuk diri sendiri) | semua |
| `.niatzakatmal` | - | Niat Zakat Mal | semua |
| `.niatqurban` | - | Niat Berkurban | semua |
| `.niatistikharah` | - | Niat Sholat Istikharah | semua |
| `.puasasunnah` | `jadwalpuasa` `puasahariini` | Puasa sunnah yang dianjurkan hari ini + jadwal sepekan | semua |
| `.surahacak` | `randomsurah` `ayatacak` `randomayat` | Surah & ayat acak beserta terjemahannya | semua |
| `.alfatihah` | `alfathiah` | Baca Al-Fatihah | semua |
| `.ayatkursi` | - | Baca Ayat Kursi (Al-Baqarah 255) | semua |
| `.alikhlas` | `ikhlas` | Baca Al-Ikhlas | semua |
| `.alfalaq` | `falaq` | Baca Al-Falaq | semua |
| `.annas` | `naas` | Baca An-Nas | semua |
| `.yasin` | `yasinan` | Baca Yasin | semua |
| `.almulk` | `mulk` | Baca Al-Mulk | semua |
| `.arrahman` | `rahman` | Baca Ar-Rahman | semua |
| `.alkahfi` | `kahfi` | Baca Al-Kahfi | semua |
| `.alwaqiah` | `waqiah` | Baca Al-Waqiah | semua |
| `.albaqarah` | - | Baca Al-Baqarah | semua |
| `.aliimran` | - | Baca Ali Imran | semua |
| `.attaubah` | - | Baca At-Taubah | semua |
| `.maryam` | - | Baca Maryam | semua |
| `.assajdah` | - | Baca As-Sajdah | semua |
| `.tafsir` | `tafsirayat` | Tafsir ringkas satu ayat (format 17:32) | semua |
| `.tasbih` | `dzikirhitung` `hitungdzikir` | Penghitung dzikir: .tasbih [+jumlah \| reset \| jenis] | semua |
| `.tatacara` | `caraberibadah` | Tata cara ibadah (wudhu, tayamum, mandi wajib, sholat, puasa, zakat) | semua |
| `.carawudhu` | - | Tata Cara Wudhu | semua |
| `.caratayamum` | - | Tata Cara Tayamum | semua |
| `.caramandiwajib` | - | Tata Cara Mandi Wajib | semua |
| `.carasholat` | - | Tata Cara Sholat (ringkas) | semua |
| `.carapuasa` | - | Tata Cara & Syarat Puasa | semua |
| `.carazakatfitrah` | - | Zakat Fitrah | semua |
| `.ululazmi` | `nabiululazmi` | 5 Nabi Ulul Azmi dan keistimewaannya | semua |
| `.imsak` | `imsakiyah` | Waktu Imsak hari ini per kota | semua |
| `.subuh` | `fajar` `sholatsubuh` | Waktu Subuh hari ini per kota | semua |
| `.syuruq` | `terbit` `matahariterbit` | Waktu Syuruq hari ini per kota | semua |
| `.dzuhur` | `zuhur` `lohor` `sholatdzuhur` | Waktu Dzuhur hari ini per kota | semua |
| `.ashar` | `asar` `sholatasar` | Waktu Ashar hari ini per kota | semua |
| `.maghrib` | `magrib` `sholatmaghrib` `buka` | Waktu Maghrib hari ini per kota | semua |
| `.isya` | `isyak` `sholatisya` | Waktu Isya hari ini per kota | semua |
| `.waris` | `faraidh` `hitungwaris` | Hitung waris sederhana: .waris <harta> istri1 anakl2 anakp1 | semua |
| `.zakatfitrah` | `hitungfitrah` | Hitung zakat fitrah: .zakatfitrah <jiwa> [hargaBeras/kg] | semua |
| `.zakatmal` | `zakatharta` `hitungzakat` | Hitung zakat mal: .zakatmal <harta> [hargaEmas/gram] | semua |
| `.zakatpenghasilan` | `zakatgaji` `zakatprofesi` | Hitung zakat penghasilan: .zakatpenghasilan <gaji/bulan> [hargaEmas] | semua |
| `.audiomurottal` | `murottal` `murattal` `audiomurattal` `murotal` `audimurottal` | 🎧 Audio MUROTTAL Al-Qur'an per ayat (Alafasy 128kbps) — `.audiomurottal 2:74` | semua |
| `.audiotilawah` | `tilawah` `audiotelawah` `telawah` `audiotilawa` `tauzwie` | 🎧 Audio TILAWAH Al-Qur'an per ayat (Al-Husaree 64kbps) — `.audiotilawah 2:74` | semua |

---

## 👑 Owner Menu (91 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.addplugin` | `tambahplugin` `konvertiplugin` `pasangplugin` `pluginconvert` `convertplugin` | 🧩 Konversi kode Bot Telegram (`bot.command(...)`) jadi plugin bot ini — langsung bisa dipakai, tanpa restart | 👑 owner |
| `.>_` | `buatplugin` `pluginbaru` `newplugin` `createplugin` `tulisplugin` `devbuat` | 🧰 Buat plugin baru dari chat (balas dokumen .js atau kirim kodenya) — langsung aktif tanpa restart | 👑 owner |
| `.cekplugin` | `checkplugin` `ujiplugin` `sintaksplugin` `cekfitur` | 🔍 Periksa sintaks + export sebuah file plugin tanpa memuatnya | 👑 owner |
| `.getcode` | `ambilkode` `lihatsumber` `sumberplugin` `kodefitur` `getplugin` | 📄 Kirim kode sumber plugin (atau file apa pun di folder bot) ke chat | 👑 owner |
| `.devmenu` | `menupengembang` `menudeveloper` `devtools` `alatdev` `menukode` `devpanel` | 🧰 Menu developer: buat plugin dari chat, ambil kode, reload, cek sintaks, cadangan | 👑 owner |
| `.plugindev` | `listplugindev` `pluginbuatan` `daftarplugindev` `pluginchat` | 🧩 Daftar plugin yang dibuat/diubah lewat .>_ | 👑 owner |
| `.hapusplugindev` | `deleteplugindev` `buangplugindev` `hapuspluginchat` `delplugindev` | 🗑️ Hapus permanen plugin buatan .>_ (file + dari memori) | 👑 owner |
| `.restoreplugin` | `kembalikanplugin` `batalplugin` `rollbackplugin` `undoplugin` | ↩️ Kembalikan plugin ke versi cadangan sebelumnya | 👑 owner |
| `.dbsize` | `dbsizestats` `dbsizejson` `cekukurandb` | 🗄 Lihat ukuran folder database & per-file *.json* (devmaks) | 👑 owner |
| `.setcashuser` | `cashtarget` `setuanguser` `setusercash` `cashtargetpremium` | 💰 (owner) Set saldo uang RPG user — `.setcashuser 62xx 1000000` atau reply + perintah | 👑 owner |
| `.pluginhealth` | `pluginstatistik` `pluginstats` `healthplugin` | 📊 Laporan ringkasan pluginlload-status (total, per-kategori) | 👑 owner |
| `.lbreset` | `resetlb` `hapuslb` `resetleaderboard` `clearlb` `resetrank` | 🧹 (Owner) Hapus papan peringkat — `.lbreset match3` atau `.lbreset semua` | 👑 owner |
| `.ban` | `unban` `addprem` `delprem` `setlimit` | Banned / premium / limit user | 👑 owner |
| `.bc` | `broadcast` | Broadcast pesan ke semua user/grup | 👑 owner |
| `.>` | `=>` `eval` | Eval JavaScript (owner only) | 👑 owner |
| `.$` | `exec` `run` | Eksekusi perintah shell/termux (owner only) | 👑 owner |
| `.plugin` | `pl` `plugins` | List / reload / delete fitur bot | 👑 owner |
| `.set` | `setbot` | Ubah setting bot (public/self, menu, ai, dll) | 👑 owner |
| `.setmenuimg` | `setmenuimage` `menuimg` `setbgmenu` | Custom gambar header menu (url / reply gambar / banner) | 👑 owner |
| `.restart` | `save` `db` `database` `leave` `join` `getdb` | Restart bot, simpan DB, kelola grup | 👑 owner |
| `.reloadfitur` | `reloadplugin` `muatfitur` | Muat ulang satu file fitur tanpa restart | 👑 owner |
| `.hapusfitur` | `unloadplugin` `buangfitur` | Nonaktifkan (hapus dari memori) satu file fitur | 👑 owner |
| `.pluginrinci` | `plugininfo` `rincifitur` | Rincian satu file fitur: daftar command & kategori | 👑 owner |
| `.pluginberkas` | `berkasfitur` `daftarfiturfile` | Daftar semua file fitur + jumlah command | 👑 owner |
| `.carifitur` | `searchcommand` `cariperintah` | Cari command berdasarkan nama/deskripsi | 👑 owner |
| `.matikanfitur` | `disablecommand` `nonaktifkan` | Sembunyikan satu command (tanpa hapus file) | 👑 owner |
| `.nyalakanfitur` | `enablecommand` `aktifkanfitur` | Aktifkan kembali command yang dimatikan | 👑 owner |
| `.fiturmati` | `listdisabled` `daftarmatikan` | Lihat daftar command yang dinonaktifkan | 👑 owner |
| `.kategorigraf` | `categorychart` `grafikfitur` | Grafik jumlah command per kategori | 👑 owner |
| `.aliascek` | `cekalias` `daftaralias` | Cek semua alias yang mengarah ke satu command | 👑 owner |
| `.dbstat` | `statistikdb` `infodbdetail` | Statistik seluruh file database | 👑 owner |
| `.ekspordb` | `exportdb` `kirimdb` | Kirim file database sebagai dokumen | 👑 owner |
| `.impordb` | `importdb` `gandidb` | Ganti isi database dari dokumen JSON (balas dokumennya) | 👑 owner |
| `.backupdb` | `cadangkandb` | Buat salinan cadangan semua database | 👑 owner |
| `.listbackup` | `daftarcadangan` | Daftar backup yang tersedia | 👑 owner |
| `.restorebackup` | `kembalikanbackup` | Kembalikan database dari backup | 👑 owner |
| `.hapusbackup` | `delbackup` | Hapus satu set backup | 👑 owner |
| `.userdetail` | `detailuser` `lihatuser` | Data lengkap seorang user di database | 👑 owner |
| `.grupdetail` | `detailgrup` `lihatgrup` | Data lengkap sebuah grup di database | 👑 owner |
| `.resetuser` | `hapususer` `bersihkanuser` | Reset data seorang user (level, limit, RPG) | 👑 owner |
| `.resetsemualimit` | `limitsemua` `isilimitall` | Isi ulang limit semua user | 👑 owner |
| `.resetsemuauser` | `wipedb` `hapussemuadata` | HAPUS semua data user (perlu konfirmasi) | 👑 owner |
| `.bcteks` | `bcall` `broadcastsemua` | Broadcast teks ke semua chat | 👑 owner |
| `.bcgrup` | `bcpesangrup` | Broadcast teks khusus ke semua grup | 👑 owner |
| `.bcprivat` | `bcpribadi` | Broadcast teks khusus ke chat pribadi | 👑 owner |
| `.bcgambar` | `broadcastgambar` | Broadcast gambar (kirim/balas gambar + caption) | 👑 owner |
| `.bcdokumen` | `broadcastfile` | Broadcast dokumen ke semua chat | 👑 owner |
| `.bctombol` | `broadcasttombol` | Broadcast dengan tombol interaktif | 👑 owner |
| `.bctunda` | `jadwalbc` `bclater` | Broadcast tertunda: .bctunda <menit> <pesan> | 👑 owner |
| `.upswgc2` | `upswgc` `upswgroup` `upstatusgrup` `statusgrup` `swgrup` `storygrup` `upswgcdua` `statusgc` | Upload STATUS WA ke semua anggota grup — dukung SEMUA tipe file (gambar/video/audio/dokumen/stiker/teks) | 👑 owner |
| `.setnamabot` | `gantinamabot` | Ubah Nama bot | 👑 owner |
| `.setfooter` | `gantifooter` | Ubah Footer menu | 👑 owner |
| `.settemamenu` | `menutheme` | Ubah Tema banner menu | 👑 owner |
| `.setmodemenu` | `menumode` | Ubah Mode menu | 👑 owner |
| `.setprefix` | `gantiprefix` | Ubah prefix command bot | 👑 owner |
| `.setlimitdefault` | `limitdefault` | Ubah limit harian default user baru | 👑 owner |
| `.setcooldown` | `ganticooldown` | Ubah jeda antar command (anti spam) | 👑 owner |
| `.setmodelai` | `gantimodelai` `aimodel` | Ubah model AI (pollinations) | 👑 owner |
| `.setapikey` | `isiapikey` | Isi API key AI (Gemini/Groq) agar lebih stabil | 👑 owner |
| `.typingon` | `nyalaketik` | Nyalakan indikator "sedang mengetik" | 👑 owner |
| `.typingoff` | `matiketik` | Matikan indikator mengetik (hemat resource) | 👑 owner |
| `.readon` | `nyalaread` `centangbiru` | Bot membaca pesan (centang biru) | 👑 owner |
| `.readoff` | `matiread` | Bot tidak menandai terbaca | 👑 owner |
| `.anticallon` | `nyalaanticall` | Tolak panggilan masuk + kirim pesan | 👑 owner |
| `.anticalloff` | `matianticall` | Matikan penolakan panggilan | 👑 owner |
| `.autobioon` | `nyalaautobio` | Bio bot otomatis (uptime & jam) | 👑 owner |
| `.autobiooff` | `matiautobio` | Matikan bio otomatis | 👑 owner |
| `.settinglist` | `semuasetting` `lihatsetting` | Lihat semua pengaturan bot | 👑 owner |
| `.logbot` | `lihatlog` `taillog` | Lihat N baris terakhir log file (kalau ada) | 👑 owner |
| `.bersihkantmp2` | `cleantmp` `hapustmp` | Hapus file sementara (tmp/) yang lebih tua dari 30 menit | 👑 owner |
| `.sesiinfo` | `infosesilogin` `sessioninfo` | Info folder sesi login WhatsApp | 👑 owner |
| `.hapussesi` | `logoutbot` `deletesession` | HAPUS sesi login (bot harus scan QR lagi) | 👑 owner |
| `.monitorcpu` | `cpuload` `bebancpu` | Ukur beban CPU & memori selama 1 detik | 👑 owner |
| `.cekapi` | `tesapi` `apicheck` | Uji semua API eksternal yang dipakai bot | 👑 owner |
| `.cekdependensi` | `npmcheck` `versimodul` | Cek versi paket terpasang vs package.json | 👑 owner |
| `.jalankanperintah` | `shell` `exec2` | Jalankan perintah shell (hati-hati!) | 👑 owner |
| `.bacafile` | `lihatfile` `catfile` | Baca isi file di folder bot | 👑 owner |
| `.listfolder` | `listfile` `isifolder` | Lihat isi folder bot | 👑 owner |
| `.restartsafe` | `restartaman` `reboot` | Restart bot dengan jeda (pesan tersampaikan dulu) | 👑 owner |
| `.matikanbot` | `shutdown` `stopbot` | Matikan bot sepenuhnya | 👑 owner |
| `.statistikpenuh` | `fullstats` `laporanbot` | Laporan lengkap pemakaian bot | 👑 owner |
| `.bantemp` | `bansementara` | Ban sementara (otomatis lepas setelah N jam) | 👑 owner |
| `.premdetail` | `infopremium` `datapremium` | Rincian semua user premium | 👑 owner |
| `.kirimfile` | `ambilfile` `sendfile` | Kirim file dari folder bot sebagai dokumen | 👑 owner |
| `.banlist` | `listban` `daftban` | Daftar user yang di-ban | 👑 owner |
| `.cleartmp` | `bersihkantmp` `clean` | Bersihkan folder tmp | 👑 owner |
| `.premlist` | `listprem` `daftpremium` | Daftar user premium | 👑 owner |
| `.resetlimit` | `resetlimitall` | Reset limit semua user ke default | 👑 owner |
| `.setppbot` | `ppbot` `gantipp` | Ganti foto profil bot (reply gambar) | 👑 owner |
| `.cmdmode` | `modeperintah` `setcmdmode` `commandmode` `modefitur` | 🔐 Atur mode per-perintah: `.cmdmode <perintah> self\|reset` — self = hanya owner/bot yang bisa memakai | 👑 owner |
| `.public` | `self` | Ganti mode bot public / self | 👑 owner |

---

## 👥 Group Menu (93 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.group` | `grup` | Buka/tutup grup | 🛡️ admin, 👥 grup |
| `.groupinfo` | `infogrup` `infogc` | Informasi grup | 👥 grup |
| `.kick` | `add` `promote` `demote` | Keluarkan/tambah/naikkan/turunkan member | 🛡️ admin, 👥 grup |
| `.linkgroup` | `linkgc` `link` | Ambil link invite grup | 👥 grup |
| `.setgrup` | `setgroup` `groupset` | Nyalakan/matikan fitur grup | 🛡️ admin, 👥 grup |
| `.setname` | `setdesc` `setppgc` `changename` `gantinamagrup` `ubahnamagrup` `renamegrup` `cngrup` | Ubah nama/deskripsi/foto grup | 🛡️ admin, 👥 grup |
| `.hidetag` | `tagall` `h` | Tag semua member grup | 🛡️ admin, 👥 grup |
| `.antilinkon` | `nyalaantilink` | Menyalakan Anti Link | 👥 grup |
| `.antilinkoff` | `matiantilink` | Mematikan Anti Link | 👥 grup |
| `.antitoxicon` | `nyalaantitoxic` | Menyalakan Anti Toxic | 👥 grup |
| `.antitoxicoff` | `matiantitoxic` | Mematikan Anti Toxic | 👥 grup |
| `.antitagsw` | `tagsw` `cekantitagsw` | Status Anti Tag SW: tag orang + kata "SW" → hapus + warn (3× = kick) | 🛡️ admin, 👥 grup |
| `.antitagswon` | `tagswon` `nyalaantitagsw` | Menyalakan Anti Tag SW | 🛡️ admin, 👥 grup |
| `.antitagswoff` | `tagswoff` `matiantitagsw` | Mematikan Anti Tag SW | 🛡️ admin, 👥 grup |
| `.bungkam` | `bisukan` `diamkan` `silent` | Bungkam member: semua pesannya otomatis dihapus (`.bungkam @nomor alasan`) | 🛡️ admin, 👥 grup |
| `.bukabungkam` | `bukamute` `bebaskan` `unbungkam` `suarakan` | Buka bungkam member | 🛡️ admin, 👥 grup |
| `.listbungkam` | `daftarbungkam` `cekbungkam` | Daftar member yang dibungkam | 🛡️ admin, 👥 grup |
| `.antideleteon` | `nyalaantidelete` | Menyalakan Anti Delete | 👥 grup |
| `.antideleteoff` | `matiantidelete` | Mematikan Anti Delete | 👥 grup |
| `.nsfwon` | `izinnsfw` | Menyalakan Konten Dewasa (NSFW) | 👥 grup |
| `.nsfwoff` | `bloknsfw` | Mematikan Konten Dewasa (NSFW) | 👥 grup |
| `.muteon` | `mutegrup` `bisugrup` | Menyalakan Mute Grup (non-admin) | 👥 grup |
| `.muteoff` | `unmute` `bukaanadmin` | Mematikan Mute Grup (non-admin) | 👥 grup |
| `.welcomenyalakan` | `welcomeon` `nyalawelcome` | Menyalakan Sambutan Member Baru | 👥 grup |
| `.welcomematikan` | `welcomeoff` `matiwelcome` | Mematikan Sambutan Member Baru | 👥 grup |
| `.goodbyenyalakan` | `goodbyeon` `nyalagoodbye` | Menyalakan Pesan Member Keluar | 👥 grup |
| `.goodbyematikan` | `goodbyeoff` `matigoodbye` | Mematikan Pesan Member Keluar | 👥 grup |
| `.settinggrup` | `setelangrup` `grupsetting` | Lihat semua pengaturan bot di grup ini | 👥 grup |
| `.mulaiabsen` | `absenmulai` `openabsen` | Mulai sesi absen di grup | 👥 grup |
| `.hadir` | `absenhadir` `present` | Absen hadir | 👥 grup |
| `.izin` | `absenizin` `tidakhadir` | Absen izin (dengan alasan) | 👥 grup |
| `.cekabsen` | `absencek` `rekapabsen` | Lihat rekap absen yang sedang berjalan | 👥 grup |
| `.selesaiabsen` | `tutupabsen` `stopabsen` | Tutup sesi absen + tampilkan yang alpa | 👥 grup |
| `.hapusabsen` | `resetabsen` `clearabsen` | Hapus data absen grup ini | 👥 grup |
| `.mulaivoting` | `voting` `buatpoll` | Buat voting: .mulaivoting Pertanyaan\|Opsi1\|Opsi2 | 👥 grup |
| `.vote` | `pilihvote` `coblos` | Beri suara: .vote 1 | 👥 grup |
| `.cekvote` | `hasilvote` `lihatpoll` | Lihat hasil voting berjalan | 👥 grup |
| `.resetvote` | `hapusvote` `tutupvoting` | Tutup & hapus voting | 👥 grup |
| `.warn` | `peringatkan` `tegur` | Beri peringatan ke member (3× = kick) | 👥 grup |
| `.unwarn` | `hapuswarn` `cabutwarn` | Cabut 1 peringatan dari member | 👥 grup |
| `.cekwarn` | `warningku` `lihatwarn` | Cek jumlah peringatan seorang member | 👥 grup |
| `.resetwarnall` | `hapussemuawarn` | Reset semua peringatan member grup ini | 👥 grup |
| `.listreminder` | `reminderlist` `daftarpengingat` | Lihat daftar pengingat grup | 👥 grup |
| `.hapusreminder` | `delreminder` | Hapus pengingat berdasarkan ID | 👥 grup |
| `.grupstat` | `statistikgrup` `infostatgrup` | Statistik member, admin & aktivitas grup | 👥 grup |
| `.daftarmember` | `listmember` `semuamember` | Daftar semua member (dengan nomor) | 👥 grup |
| `.carimember` | `carianggota` `findmember` | Cari member berdasarkan nomor/nama tersimpan | 👥 grup |
| `.cekadmin` | `siapaadmin` `adminnya` | Cek apakah seseorang admin grup | 👥 grup |
| `.fotogrup` | `ppgrup` `fotoprofilgrup` | Ambil foto profil grup | 👥 grup |
| `.deskripsigrup` | `descgrup` `deskripsigroup` | Tampilkan deskripsi lengkap grup | 👥 grup |
| `.kartugrup` | `infokartu` `groupcard` | Kartu gambar berisi info grup | 👥 grup |
| `.cekundangan` | `infoundangan` `ceklinkgrup` | Cek isi link undangan grup WhatsApp | 👥 grup |
| `.previewwelcome` | `contohwelcome` `teswelcome` | Pratinjau kartu sambutan member baru | 👥 grup |
| `.previewgoodbye` | `contohgoodbye` `tesgoodbye` | Pratinjau kartu perpisahan member | 👥 grup |
| `.tagallcustom` | `hidetagall` `tagsemua` | Tag semua member dengan pesan sendiri | 👥 grup |
| `.tagadmin` | `panggiladmin` `mentionadmin` | Tag semua admin grup | 👥 grup |
| `.pengumuman` | `announce` `broadcastgrup` | Pengumuman resmi dengan tombol konfirmasi | 👥 grup |
| `.sudahbaca` | `konfirmasi` | Konfirmasi sudah membaca pengumuman | 👥 grup |
| `.cekpengumuman` | `siapasudahbaca` | Lihat siapa saja yang sudah konfirmasi pengumuman | 👥 grup |
| `.hidetagmedia` | `forwardmedia` | Teruskan media ke semua member (hidetag) | 👥 grup |
| `.setaturan` | `setrules` `aturanbaru` | Simpan aturan grup (dibaca lewat .aturangrup) | 👥 grup |
| `.aturangrup` | `rulesgrup` `bacaaturan` | Tampilkan aturan grup | 👥 grup |
| `.resetgrup` | `resetsetting` `hapussetting` | Reset semua pengaturan bot di grup ini | 👥 grup |
| `.tagme` | `tagaku` | Tag dirimu sendiri (uji coba mention) | 👥 grup |
| `.hitungaktif` | `memberaktif` `siapaaktif` | Hitung member yang tercatat aktif memakai bot | 👥 grup |
| `.kuisgrup` | `kuisbareng` `mainkuis` | Mulai kuis acak untuk seluruh grup | 👥 grup |
| `.gcid` | `idgrup` `idgc` | Tampilkan JID grup ini | 👥 grup |
| `.kickme` | `keluarkanaku` `out` | Keluarkan diri sendiri dari grup (serius!) | 👥 grup |
| `.listadmin` | `adminlist` `daftadmin` | Daftar admin grup | 👥 grup |
| `.revoke` | `resetlink` `gantilink` | Reset link invite grup | 🛡️ admin, 👥 grup |
| `.totalmember` | `membercount` `jumlahmember` | Jumlah member grup ini | 👥 grup |
| `.addall` | `tambahsemua` `addmassal` `undangbanyak` `addbatch` | ➕ Tambah beberapa nomor sekaligus ke grup (maks 10 per perintah) | 🛡️ admin, 👥 grup |
| `.open` | `close` `bukagrup` `tutupgrup` `gopen` `gclose` | 🌐 Buka / 🔒 tutup grup (hanya admin yang boleh kirim pesan) | 🛡️ admin, 👥 grup |
| `.catatan` | `notegroup` `catatangrup` `noteresmi` `catatanresmi` | 📝 Catatan bersama grup — `.catatan <isi>` simpan, `.catatan` daftar, `.catatan baca 2`, `.catatan hapus 2` | 👥 grup |
| `.cn` | `costumname` `customname` `fontnama` `namafont` `stylenama` `namakfont` `namaestetik` | 📛 Ubah nama orang dengan font keren (siap salin) — `.cn Arif` atau `.cn 5 Arif`. Ganti nama grup: .setname | semua |
| `.groupmenu` | `grupmenu` `menugc` `kelolagrup` `groupadmin` `pusatgrup` `groupmenuv76` | 👥 Menu lengkap kelola grup: buka/tutup, anggota, sider, identitas, welcome, proteksi, statistik | semua |
| `.sider` | `listider` `anggotadiam` `memberdiam` `siderview` `ceksider` | 👀 Daftar anggota yang tidak pernah terlihat mengirim pesan sejak pelacakan | 🛡️ admin, 👥 grup |
| `.totalchat` | | 👀 Total pesan grup sejak pelacakan dimulai | 🛡️ admin, 👥 grup |
| `.kicksider` | `tendangsider` `hapussider` `kickersider` `buangsider` | 🧹 Keluarkan anggota yang tidak pernah terlihat mengirim pesan (owner, konfirmasi) | 👑 owner, 👥 grup |
| `.kickall` | `tendangsemua` `kikall` `bersihkangrup` `kicksemua` | 💥 Keluarkan SEMUA anggota non-admin dari grup (owner, konfirmasi) | 👑 owner, 👥 grup |
| `.demoteall` | `turunkansemua` `demotesemua` `copotadmin` | ⬇️ Turunkan semua admin jadi member biasa (owner, konfirmasi) | 👑 owner, 👥 grup |
| `.resetaktif` | `resetaktivitas` `mulaillacak` `resetlacasider` `resetpelacakan` | 🔄 Mulai ulang pencatatan aktivitas grup (dipakai .sider) | 🛡️ admin, 👥 grup |
| `.totag` | `tagmember` `pingmember` `sebutmember` `panggilmber` `mentionmember` | 📣 Panggil/tag 1 anggota utk yang balas/nomor/pilih — `.totag` (balas = kalimat ping) · `.totag 628xxx halo bob` atau tag orangnya | 🛡️ admin, 👥 grup |
| `.turnamen` | `turney` `quizbattle` `tournamen` `lombakuis` `tantangankuis` | 🏆 Buka/kelola turnamen kuis antarmember grup — 60 detik per soal, podium+hadiah RPG | 👥 grup |
| `.welcomecard` | `kartuwelcome` `customcard` | Preview kartu welcome custom | 🛡️ admin, 👥 grup |
| `.goodbye` | `setgoodbye` `kartukeluar` | Aktif/matikan kartu member keluar | 🛡️ admin, 👥 grup |
| `.listtheme` | `themelist` `daftartema` | Daftar tema kartu welcome | 👥 grup |
| `.resetwelcometext` | `resetleavetext` | Kembalikan template bawaan | 🛡️ admin, 👥 grup |
| `.settheme` | `setwelcometheme` `themecard` | Set tema gradient kartu welcome | 🛡️ admin, 👥 grup |
| `.setwelcomebg` | `setbgwelcome` `welcomebg` | Set latar custom kartu (url / reply gambar) | 🛡️ admin, 👥 grup |
| `.setwelcomemode` | `welcomemode` | Pilih mode kartu: gambar atau teks | 🛡️ admin, 👥 grup |
| `.setwelcometext` | `setleavetext` `setwelcomepesan` | Set template pesan welcome/goodbye | 🛡️ admin, 👥 grup |
| `.welcomeinfo` | `infowelcome` `welcomecek` | Lihat pengaturan welcome grup ini | 👥 grup |
| `.welcome` | `setwelcome` | Aktif/matikan sambutan member baru | 🛡️ admin, 👥 grup |

---

## 🎲 Fun Menu (78 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.truth` | `dare` `tod` | Truth or Dare random | semua |
| `.howgay` | `howbucin` `howganteng` `howcantik` `howstupid` | Ngukur kadar sifat (hiburan semata) | semua |
| `.jodoh` | `couple` `cekjodoh` `love` | Cek kecocokan pasangan (hiburan) | semua |
| `.tebak` | `askai` `tanyaai` | Tanya apa saja ke AI (mode santai) | semua |
| `.wallpaper` | `wp` `gambar` | Cari/generate wallpaper keren | semua |
| `.gombalkode` | `gombalprogrammer` `pickupline` | Gombalan ala programmer | semua |
| `.rayuanmakan` | `rayuanhalus` `gombalhalus` | Rayuan halus bikin senyum | semua |
| `.sindiranhalus` | `sindiran` `nyindir` | Sindiran halus untuk teman | semua |
| `.ucapanbagus` | `ucapan` `kataucapan` | Ucapan untuk momen spesial | semua |
| `.faktaaneh` | `faktamenarik` `tahukahkamu` | Fakta aneh yang jarang diketahui | semua |
| `.pepatahlama` | `peribahasa` `pepatah` | Peribahasa + maknanya | semua |
| `.quotesinggris` | `katabahasainggris` `quoteen` | Quotes Inggris + terjemahan | semua |
| `.pantunlucu` | `pantunjenaka` `pantunkocak` | Pantun jenaka | semua |
| `.jokesbapak` | `jokesbapak2` `bapack` | Jokes bapak-bapak | semua |
| `.tebakkonyol` | `tebakanlucu` `riddle` | Tebakan konyol + jawaban | semua |
| `.cekwibu` | `howwibu` `cekwibuku` | Tingkat kewibuan | semua |
| `.cekjagoan` | `howjagoan` `cekjagoanku` | Tingkat kejagoan | semua |
| `.cekpintar` | `howpintar` `cekpintarku` | Tingkat kepintaran | semua |
| `.ceksabar` | `howsabar` `ceksabarku` | Tingkat kesabaran | semua |
| `.cekdermawan` | `howdermawan` `cekdermawanku` | Tingkat kedermawanan | semua |
| `.cekegois` | `howegois` `cekegoisku` | Tingkat keegoisan | semua |
| `.cekromantis` | `howromantis` `cekromantisku` | Tingkat keromantisan | semua |
| `.cekgalau` | `howgalau` `cekgalauku` | Tingkat kegalauan | semua |
| `.cekngantuk` | `howngantuk` `cekngantukku` | Tingkat kantuk | semua |
| `.ceklaper` | `howlaper` `ceklaperku` | Tingkat kelaparan | semua |
| `.cekrajin` | `howrajin` `cekrajinku` | Tingkat kerajinan | semua |
| `.cekberuntung` | `howberuntung` `cekberuntungku` | Tingkat keberuntungan | semua |
| `.cekimut` | `howimut` `cekimutku` | Tingkat keimutan | semua |
| `.cekcool` | `howcool` `cekcoolku` | Tingkat kecool-an | semua |
| `.cekcerewet` | `howcerewet` `cekcerewetku` | Tingkat kecerewetan | semua |
| `.zalgo` | `tekszalgo` `glitch` | Teks zalgo/glitch | semua |
| `.bubbletext` | `teksbubble` `hurufbulat` | Teks huruf bubble (ⓐⓑⓒ) | semua |
| `.smallcaps` | `smallcapteks` `smallcap` | Teks small caps (ᴀʙᴄ) | semua |
| `.fullwidth` | `tekslebar` `aesthetic` | Teks fullwidth (ａｂｃ) | semua |
| `.coretteks` | `tekscoret` `strike` | Teks tercoret (a̶b̶c̶) | semua |
| `.garisbawah` | `teksunderline` `underline` | Teks bergaris bawah (a̲b̲c̲) | semua |
| `.superscript` | `teksatas` `superskrip` | Teks superscript (ᵃᵇᶜ) | semua |
| `.mirrorteks` | `tekscermin` `flip` | Teks terbalik (uʍop əpᴉsdn) | semua |
| `.kapalcinta` | `lovecalc` `hitungcinta` | Kalkulator cinta 2 nama | semua |
| `.hitungkecocokan` | `cocokmeter` `matchmeter` | Kecocokan 2 hal apa saja (nama/hobi/tim) | semua |
| `.umurmental` | `mentalage` | Umur mental berdasarkan nama | semua |
| `.ramalnasib` | `nasib` `ramalan` | Ramalan nasib hari ini (hiburan) | semua |
| `.haribaik` | `haribagus` `harihoki` | Cari hari baik minggu ini dari tanggal lahir (weton) | semua |
| `.nomercantik` | `nomorhoki2` `nomorindah` | Cari pola nomor cantik/hoki dari nomormu | semua |
| `.generatoralasan` | `alasanku` `excuse` | Generator alasan lucu (untuk telat/bolos) | semua |
| `.kalimatbucin` | `bucinhari` `katamabuk` | Kalimat bucin siap kirim | semua |
| `.generatornama` | `namarandom` `buatnama` | Generator nama Indonesia (cowok/cewek) | semua |
| `.kapsulkata` | `kapsulwaktu` `timecapsule` | Tulis pesan untuk dirimu di masa depan (tersimpan di DB) | semua |
| `.bukakapsul` | `kapsulku` | Buka kapsul waktu yang sudah jatuh tempo | semua |
| `.roletkeputusan` | `decisionmaker` `putuskan` | Bantu ambil keputusan: bot memilih untukmu | semua |
| `.generatorcaption` | `captionig` `bikincaption` | Generator caption sosmed dari kata kunci | semua |
| `.generatoride` | `idegiatan` `bosan` | Ide kegiatan saat bosan | semua |
| `.acakteman` | `randomteman` `pasanganteman` | Acak pasangan member grup (untuk game/kegiatan) | 👥 grup |
| `.moodhari` | `moodku` `perasaanku` | Deteksi mood berdasarkan nama + jam sekarang | semua |
| `.tebakwajah` | `siapadia` | Bot memberi ciri-ciri, tebak siapa di grup | 👥 grup |
| `.apakah` | `apakahaku` | Tanya ya/tidak (magic 8-ball) | semua |
| `.artinama` | `artnama` `namasaya` | Arti nama (hiburan, dari hash) | semua |
| `.bagaimana` | `gimana` `how` | Tanya bagaimana caranya | semua |
| `.bisakah` | `bisatidak` | Tanya bisa atau tidak | semua |
| `.katagombal2` | `rayu` `bucinlokal` | Kata-kata bucin | semua |
| `.cantikcek` | `cekcantik` `gantengcek` `cekganteng` | Cek tingkat kecantikan/ketampanan | semua |
| `.coinflip` | `lemparkoin` `koin` | Lempar koin (heads/tails) | semua |
| `.dadu` | `roll` `dice` | Lempar dadu 1-6 | semua |
| `.fakta` | `faktaunik` `tahukah` | Fakta unik dunia | semua |
| `.gombal` | `gombalan` | Gombalan maut | semua |
| `.kapankah` | `kapan` | Tanya kapan sesuatu terjadi | semua |
| `.luckynumber` | `angkahoki` `nomorhoki` | Angka hoki hari ini | semua |
| `.motivasi` | `semangat` | Kata motivasi | semua |
| `.pantun` | - | Pantun acak | semua |
| `.pick` | `pilih` `pilihkan` | Pilih acak dari daftar (pisahkan dengan \|) | semua |
| `.katabijak` | `bijak` `quotelokal` | Kutipan penyemangat | semua |
| `.rate` | `nilai` `seberapa` | Beri nilai acak 1-10 untuk sesuatu | semua |
| `.receh` | `joke` `jokes` `humor` | Jokes receh | semua |
| `.ship` | `cocok` | Cek kecocokan dua nama (format: a\|b) | semua |
| `.siapakah` | `siapa` | Tunjuk acak satu orang (tag/daftar) | semua |
| `.umurcek` | `cekumur` `tebakumur` | Tebak umur acak (untuk hiburan) | semua |
| `.zodiac` | `bintang` `rasi` | Cek zodiak dari tanggal (format: dd/mm) | semua |
| `.quote` | `quotes` `kata` `bucin` | Quote random / dibuatkan AI (ada cadangan offline) | semua |

---

## ⬇️ Downloader (74 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.tiktok` | `tt` `ttdown` | Download video TikTok tanpa watermark | semua |
| `.get` | `fetch` `media` | Ambil media/file dari URL langsung | semua |
| `.ss` | `ssweb` `screenshot` `webshot` | Screenshot tampilan website | semua |
| `.ttaudio` | `tiktokmp3` `ttmp3` | Download audio TikTok (mp3) | semua |
| `.ttvideo` | `tiktokvideo` `ttmp4` | Unduh video TikTok (tanpa watermark) | semua |
| `.ttnowm` | `tiktoknowm` `tttanpawm` | Unduh TikTok tanpa watermark + pilih kualitas | semua |
| `.ttwm` | `tiktokwm` | Unduh video TikTok dengan watermark asli | semua |
| `.ttmusik` | `ttaudiomp3` `ttsound` | Unduh audio/musik TikTok (MP3) | semua |
| `.ttinfo` | `tiktokinfo` `ttstat` | Info & statistik video TikTok (tanpa unduh) | semua |
| `.ttcover` | `tiktokthumb` `ttthumb` | Ambil cover/thumbnail video TikTok | semua |
| `.ttslide` | `tiktokfoto` `ttslideshow` | Unduh semua foto dari post slide TikTok | semua |
| `.ttunduh` | `tiktoklengkap` `ttpaket` | Paket lengkap TikTok: info + tombol semua format | semua |
| `.ytcari` | `ytsearch` `cariyoutube` | Cari video YouTube (saran + tautan) | semua |
| `.ytinfo` | `ytmetadata` `infoyt` | Info video YouTube (judul, channel, thumbnail) | semua |
| `.ytthumb` | `thumbnailyt` `coveryt` | Ambil thumbnail video YouTube | semua |
| `.ytvideo` | `ytmp4` `unduhyt` | Unduh video YouTube (MP4 ≤720p, butuh yt-dlp) | semua |
| `.ytvideo360` | `yt360` | Unduh video YouTube kualitas 360p (hemat kuota) | semua |
| `.ytmp3dl` | `ytaudio` `ytmusik` | Unduh audio YouTube jadi MP3 (butuh yt-dlp + ffmpeg) | semua |
| `.ytplaylist` | `ytlist` | Info playlist YouTube + unduh 3 video pertama | semua |
| `.ytdlpinfo` | `cekytdlp` `statusytdlp` | Cek apakah yt-dlp & ffmpeg sudah terpasang | semua |
| `.wikigambar` | `carigambar` `gambarcommons` | Cari & unduh gambar dari Wikimedia Commons | semua |
| `.gambarhd` | `gambarkualitas` | Unduh gambar resolusi penuh dari Wikimedia | semua |
| `.fotowiki` | `gambarwiki` `wikimedia` | Ambil gambar utama artikel Wikipedia Indonesia | semua |
| `.randomgambar` | `picsum` `fotorandom` | Kirim foto acak berkualitas (Picsum) | semua |
| `.gambartema` | `loremflickr` `gambarkata` | Foto acak sesuai kata kunci (LoremFlickr) | semua |
| `.wallpaperhd` | `walldl` `latarhd` | Wallpaper HP (1080×1920) sesuai tema | semua |
| `.benderabesar` | `flagdl` `benderahd` | Unduh gambar bendera negara resolusi besar | semua |
| `.situslogo` | `logositus` `logoweb` | Ambil logo/favicon sebuah situs | semua |
| `.fotogithub` | `avatargithub` `ghavatar` | Ambil foto profil pengguna GitHub | semua |
| `.emojiunduh` | `emojipng` `ambilemoji` | Unduh emoji Apple sebagai gambar PNG | semua |
| `.ambilgambar` | `getimage` `unduhgambar` | Unduh gambar dari link langsung | semua |
| `.ambilvideo` | `getvideo` `unduhvideo` | Unduh video dari link langsung | semua |
| `.ambilaudio` | `getaudio` `unduhmp3` | Unduh audio/MP3 dari link langsung | semua |
| `.ambildokumen` | `getfile` `unduhfile` | Unduh file apa pun jadi dokumen | semua |
| `.mediainfo` | `cekmedia` `infourl` | Cek isi sebuah link tanpa mengunduh penuh | semua |
| `.simpanmedia` | `savekefile` | Simpan media dari link ke folder tmp bot | semua |
| `.ssfull` | `screenshotpenuh` `sslengkap` | Screenshot halaman penuh (panjang) | semua |
| `.ssmobile` | `sshp` `screenshotmobile` | Screenshot tampilan mobile (390×844) | semua |
| `.ssdesktop` | `sspc` `screenshotdesktop` | Screenshot tampilan desktop (1366×768) | semua |
| `.sslebar` | `sswide` `ss1920` | Screenshot layar lebar 1920×1080 | semua |
| `.arsipweb` | `wayback` `webarchive` | Buka versi arsip (Wayback Machine) sebuah situs | semua |
| `.cekarsip` | `arsiptersedia` | Cek cepat apakah sebuah situs punya arsip | semua |
| `.uploadfile` | `uploadke` `hostingfile` | Upload file/media ke hosting & dapat link | semua |
| `.uploadgambar` | `hostingfoto` `imguralternatif` | Upload gambar dan dapat link langsung | semua |
| `.uploadvideo` | `hostingvideo` | Upload video dan dapat link langsung | semua |
| `.kirimulang` | `forward` `teruskan` | Kirim ulang media yang dibalas ke chat ini | semua |
| `.mediakedokumen` | `jadifile` `konversidokumen` | Ubah media yang dibalas menjadi file dokumen | semua |
| `.albumgambar` | `kirimalbum` `multiimage` | Kirim beberapa gambar sekaligus dari daftar link | semua |
| `.tautanpendek` | `perpendekmedia` `pendekkanlink` | Perpendek link hasil unduhan/upload | semua |
| `.panduandownload` | `caradownload` `panduanunduh` | Panduan lengkap memakai fitur downloader | semua |
| `.sumberdownload` | `apisdownload` `sumbermedia` | Daftar sumber/API yang dipakai fitur downloader | semua |
| `.downloadgagal` | `dlerror` `solusidownload` | Penyebab & solusi unduhan gagal | semua |
| `.riwayatdownload` | `riwayatdl` `dlku` | Riwayat 25 unduhan terakhir kamu | semua |
| `.listdownload` | `dlmenu2` `semuadownload` | Daftar semua perintah downloader | semua |
| `.pinterest` | `pin` `pinsearch` `caripin` `pinterestdl` `carpin` | 📌 Cari & unduh gambar Pinterest — `.pinterest sadviora anime` atau `.pin 3 kucing lucu` | semua |
| `.pinvideo` | `pinvid` `videopin` `videopinterest` `pinvideodl` | 🎬 Cari & unduh video dari Pinterest — `.pinvideo kucing lucu 2` | semua |
| `.pininfo` | `infopin` `detailpin` `pindetail` | 🔎 Detail 1 pin Pinterest (judul, statistik, media) — `.pininfo 68749758173` | semua |
| `.acaklagu` | `shufflelagu` `kocoklagu` `randomlagu` `mixlagu` | 🔀 Kocok antrian .play2 lalu putar dari lagu pertama | semua |
| `.antrianlagu` | `queuelagu` `daftarantrian` `antrianmusik` `queueplay2` `listantrian` | 📜 Antrian lagu .play2 saat ini + buka ulang kartu HTML player-nya | semua |
| `.carilagu` | `carimusik` `searchlagu` `cari2` `searchmusik` | 🔎 Cari lagu (Deezer + iTunes) dan tampilkan daftarnya tanpa memutar — pilih nomor untuk memutar | semua |
| `.play2` | `musik2` `spotify` `playermusik` `putar2` `lagu2` `nowplaying` `spotifplay` `play2html` `musikhtml` `playerhtml` | 🎧 Player musik gaya SPOTIFY + 🎤 LIRIK (HTML app: disc vinyl, tab antrean/lirik, D-pad) — audio preview Deezer/iTunes dikirim sebagai pesan audio WhatsApp | semua |
| `.play2rich` | `play2airich` `playerspotify` `airichplayer` `musikairich` `play2pill` | 🎧 Player musik AIRich ala Spotify (versi v7.4): kartu live-edit + pill kontrol + audio terkirim ke chat | semua |
| `.unduhlagu` | `dllagu` `downloadlagu` `kirimlagu` `unduhmusik` `savelagu` `dlsong` `ambillagu` | 📥 Kirim audio preview (30 detik) lagu dari antrian .play2 — `.unduhlagu 3`, tambah kata `file` untuk dokumen .mp3/.m4a | semua |
| `.heartlagu` | `lovelagu` `tandaisuka` `sukaini` `likesong` `heartsong` `simpanlagu` | ❤️ Simpan/hapus lagu dari antrian .play2 ke daftar lagu suka (database/musik.json) — `.heartlagu 2` | semua |
| `.lagusuka` | `favoritmusik` `musikfavorit` `sukalagu` `lagufavorit` `playlistku` | ❤️ Daftar lagu yang disukai dari player .play2 — balas dengan nomor untuk memutar | semua |
| `.riwayatlagu` | `historylagu` `laguterakhir` `riwayatmusik` `terakhirputar` | 🕘 10 lagu terakhir yang diputar lewat .play2 — balas dengan nomor untuk memutar ulang | semua |
| `.stopplay2` | `tutupplayer` `matikanmusik` `closeplayer` `stopmusik2` | ⏹️ Tutup player musik .play2 di chat ini | semua |
| `.statusplayer` | `nowplay` `sedangputar` `playerinfo` | 📊 Tampilkan ulang kartu player: HTML app (antrian terakhir) atau AIRich bila sesi live masih aktif | semua |
| `.kartulagu` | `kartuplayer` `playercard` `tampilkartu` `kartumusik` `playercard2` | 🖼 Kirim ulang kartu HTML player .play2 (tanpa mengirim audio lagi) | semua |
| `.liriklagu` | `lirik` `lyric` `lyrics` `lirikmusik` `textlirik` `tekslirik` | 🎤 Kirim lirik lagu dari antrian .play2 sebagai teks (LRCLIB) — `.liriklagu 3` | semua |
| `.nextlagu` | `lagunext` `nextmusic` `lanjutlagu` `laguberikut` `skiplagu` `nextrpg` | ⏭ Lagu berikutnya di antrian .play2 (audio dikirim sebagai pesan WhatsApp) | semua |
| `.prevlagu` | `laguprev` `prevmusic` `mundurlagu` `lagusebelum` `backlagu` | ⏮ Lagu sebelumnya di antrian .play2 | semua |
| `.putarlagu` | `mainkanlagu` `playtrack` `lagunomor` `pilihlagu` `mainnomor` | 🔢 Putar lagu nomor N di antrian .play2 — `.putarlagu 3` | semua |
| `.ulanglagu` | `replaylagu` `putarulang` `lagulagi` `repeatlagu` `kirimulangaudio` | 🔁 Kirim ulang audio lagu yang sedang diputar | semua |

---

## ℹ️ Info Menu (71 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.airichunsur` | `unsurairich` `airichkimia` `kartuunsur` | Kartu AI Rich info unsur kimia (nama, simbol, golongan) | semua |
| `.airichnegara` | `negaraairich` `airichcountry` `kartunegara` | Kartu AI Rich info negara (ibu kota, mata uang, wilayah) | semua |
| `.ping` | `speed` `runtime` `botstatus` `status` `sc` `script` `infobot` | Kecepatan, runtime & status bot | semua |
| `.negara` | `infonegara` `countryinfo` | Info lengkap sebuah negara | semua |
| `.carinegara` | `searchnegara` `negaracari` | Cari negara berdasarkan nama/ibukota/mata uang | semua |
| `.negararandom` | `randomnegara` `negaracak` | Negara acak (untuk kuis/belajar) | semua |
| `.benderanegara` | `flagcountry` `bendera` | Bendera sebuah negara (emoji + gambar) | semua |
| `.ibukotadunia` | `capital` `ibukota` | Ibu kota sebuah negara | semua |
| `.matauangdunia` | `currencycountry` `uangnegara` | Mata uang sebuah negara | semua |
| `.kodenegara` | `countrycode` `kodepanggil` | Kode panggil, TLD & ISO sebuah negara | semua |
| `.luasnegara` | `countryarea` `areanegara` | Luas wilayah sebuah negara + peringkat | semua |
| `.bahasadunia` | `countrylanguage` `bahasanegara` | Bahasa resmi sebuah negara | semua |
| `.tetanggaan` | `neighbour` `batasnegara` | Negara-negara yang berbatasan darat | semua |
| `.negararegion` | `regioncountry` `listregion` | Daftar negara per wilayah: .negararegion Asia | semua |
| `.koordinatnegara` | `mapnegara` `lokasinegara` | Koordinat + link peta sebuah negara | semua |
| `.jaraknegara` | `jarakibu` `jarak2negara` | Jarak & arah antar ibu kota dua negara | semua |
| `.negarapbb` | `pbb` `anggotapbb` | Statistik anggota PBB dalam dataset | semua |
| `.sebutannegara` | `demonym` `warganegara` | Sebutan warga sebuah negara | semua |
| `.provinsi` | `infoprovinsi` | Info provinsi Indonesia | semua |
| `.cariprovinsi` | `searchprovinsi` | Cari provinsi berdasarkan nama/ibukota | semua |
| `.provinsirandom` | `randomprovinsi` | Provinsi acak | semua |
| `.provinsipulau` | `listpulau` `pulau` | Daftar provinsi per pulau | semua |
| `.ibukotaprovinsi` | `capitalprovinsi` | Ibu kota sebuah provinsi | semua |
| `.jumlahprovinsi` | `statprovinsi` | Statistik provinsi Indonesia per pulau | semua |
| `.unsur` | `infounsur` `kimia` | Info unsur kimia (simbol/nama/nomor atom) | semua |
| `.atomnomor` | `nomoratom` | Unsur berdasarkan nomor atom | semua |
| `.golongankimia` | `listgolongan` | Daftar unsur dalam satu golongan | semua |
| `.unsurrandom` | `randomunsur` | Unsur kimia acak | semua |
| `.carikimia` | `searchkimia` `cariunsur` | Cari unsur kimia | semua |
| `.tabelperiodik` | `periodik` | Ringkasan tabel periodik per golongan | semua |
| `.jamberapa` | `jamsekarang` `jamdunia` | Jam sekarang di berbagai zona waktu | semua |
| `.zonawaktu` | `wib` | Penjelasan zona waktu Indonesia | semua |
| `.tanggalsekarang` | `hariini` `tanggalnow` | Info tanggal hari ini | semua |
| `.kalender` | `kalenderbulan` | Kalender ASCII: .kalender [bulan] [tahun] | semua |
| `.weton` | `wetonjawa` `neptu` | Hitung weton Jawa + neptu dari tanggal lahir | semua |
| `.shio` | `shiochina` `zodiakcina` | Shio & elemen dari tahun/tanggal lahir | semua |
| `.zodiakdetail` | `bintangdetail` `zodiak` | Zodiak + elemen + sifat dari tanggal lahir | semua |
| `.harikerja` | `hari kerja` | Hitung hari kerja di antara dua tanggal | semua |
| `.detiksejaklahir` | `detikhidup` `lama hidup` | Hitung detik/menit/jam sejak tanggal lahir | semua |
| `.kutipanhari` | `quoteday` `kutipan` | Kutipan hari ini (tetap sepanjang hari) | semua |
| `.harilibur` | `liburnasional` `harinasional` | Hari libur nasional Indonesia (tanggal tetap + Islam) | semua |
| `.haridunia` | `hariinternasional` | Peringatan/hari besar dunia untuk tanggal tertentu | semua |
| `.konversipanjang` | `panjang` `satuanpanjang` | Konversi panjang: .konversipanjang 5 km m | semua |
| `.konversiberat` | `berat` `satuanberat` | Konversi berat: .konversiberat 2 kg ons | semua |
| `.konversidata` | `data` `ukurandata` | Konversi ukuran data: .konversidata 1500 mb gb | semua |
| `.konversiwaktu` | `waktu` `satuanwaktu` | Konversi waktu: .konversiwaktu 3 jam menit | semua |
| `.konversikecepatan` | `kecepatan` `satuankecepatan` | Konversi kecepatan: .konversikecepatan 100 km/jam mph | semua |
| `.infoversi` | `versi` `version` | Versi bot, Node.js & platform | semua |
| `.infomemori` | `memori` `ramusage` | Pemakaian memori proses bot | semua |
| `.infosesi` | `uptime` `runtime2` | Uptime bot & sistem | semua |
| `.datasetinfo` | `infodata` `datainfo` | Jumlah data tiap file dataset bot | semua |
| `.kategorimenu` | `infokategori` `statkategori` | Statistik jumlah command per kategori | semua |
| `.fiturterpopuler` | `cmdterpopuler` `topcommand` | Command paling sering dipakai | semua |
| `.infostorage` | `diskusage` `storage` | Pemakaian disk folder bot & database | semua |
| `.infoconfig` | `konfigurasi` `setting` | Lihat konfigurasi bot (aman, tanpa rahasia) | semua |
| `.infouser` | `statistikuser` | Statistik pengguna & grup (owner) | 👑 owner |
| `.aistatus` | `cekai` `infai` | Status & konfigurasi AI saat ini | semua |
| `.channel` | `follow` `saluran` | Link channel WhatsApp bot | semua |
| `.cpuinfo` | `cpu` `cekcpu` | Info & beban CPU saat ini | semua |
| `.credit` | `kredit` `thanks` `terimakasih` | Credit & ucapan terima kasih | semua |
| `.dbinfo` | `infodb` `cekdb` `dbbot` | Info database JSON bot | semua |
| `.listgc` | `listgrup` `grupbot` `grouplist` | Daftar grup yang dimasuki bot | semua |
| `.nodeinfo` | `nodever` `ceknode` | Versi Node.js & path proses | semua |
| `.osinfo` | `sistem` `sysinfo` `os` | Info sistem operasi & host | semua |
| `.raminfo` | `ram` `meminfo` `cekram` | Pemakaian memori sistem & proses | semua |
| `.repo` | `githubrepo` `source` | Link repository / source | semua |
| `.statbot` | `statistik` `stats` | Statistik pemakaian bot | semua |
| `.topcmd` | `commandtop` `perintahpopuler` | 10 command paling sering dipakai | semua |
| `.totalfitur` | `fiturcount` `jumlahfitur` | Hitung total perintah & kategori | semua |
| `.totaluser` | `usercount` `jumlahuser` | Jumlah user terdaftar di database | semua |
| `.statfitur` | `statperintah` `perintahstat` `featurestats` `cmdstat` `statfiturkarni` | 📈 Dashboard statistik pemakaian perintah bot (top dipaksi, kategori paling ramai, total hit) | semua |

---

## 👤 User Menu (67 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.afk` | - | Tandai diri sedang AFK | semua |
| `.ingatkan` | `reminder` `pengingat` | Pengingat pribadi: .ingatkan <menit> <teks> | semua |
| `.hitsaya` | `hitku` `mystats` `statkuu` `perintahku` `lihatstatsaya` | 👤 Statistik pemakaian perintah milikmu (total, favorit, 10 perintah terakhir) | semua |
| `.claim` | `daily` `klaim` | Klaim limit harian (1x / 24 jam) | semua |
| `.profile` | `me` `cek` `limit` `checklimit` | Cek profil & limit kamu | semua |
| `.leaderboard` | `lb` `rank` | Papan peringkat user | semua |
| `.daftar` | `reg` `register` | Daftar database bot (format: nama\|umur) | semua |
| `.profilkartu` | `kartuprofil` `cardprofile` | Kartu profil bergambar (level, EXP, limit) | semua |
| `.levelcard` | `kartulevel` `progresslevel` | Kartu progres level ke berikutnya | semua |
| `.progresdetail` | `rumuslevel` `detaillevel` | Penjelasan sistem level & cara cepat naik | semua |
| `.setbio` | `gantibio` `bioku` | Pasang bio singkat yang tampil di kartu profil | semua |
| `.biodataku` | `lihatbio` `infoprofil` | Lihat bio & identitas tersimpan | semua |
| `.setumur` | `gantiumur` `umurku` | Ubah umur tersimpan (untuk verifikasi) | semua |
| `.verifikasiulang` | `daftarulang` `registerulang` | Daftar ulang (kalau data verifikasi rusak) | semua |
| `.cekverifikasi` | `statusdaftar` `sudahdaftar` | Cek apakah kamu sudah terverifikasi | semua |
| `.ekspordataku` | `unduhdataku` `dataku` | Unduh seluruh data kamu di database bot | semua |
| `.resetdataku` | `hapusdataku` | Hapus data kamu sendiri (perlu konfirmasi) | semua |
| `.limitku` | `ceklimit` `sisalimit` | Lihat sisa limit & cara menambahnya | semua |
| `.klaimmingguan` | `weekly` `mingguan` | Klaim bonus mingguan (7 hari sekali) | semua |
| `.klaimbulanan` | `monthly` `bulanan` | Klaim bonus bulanan (30 hari sekali) | semua |
| `.tukarlimit` | `belilimit` `exp2limit` | Tukar 500 EXP jadi 5 limit | semua |
| `.transferlimit` | `kirlimit` `bagilimit` `tflimit` `kirimlimit` | Kirim limit ke user lain (khusus premium, fee 10%, min 5) | semua |
| `.riwayatlimit` | `loglimit` `limitlog` | Riwayat pemakaian limit kamu | semua |
| `.biayaperintah` | `hargacommand` `costcmd` | Lihat biaya limit sebuah command | semua |
| `.hematmode` | `modehemat` | Daftar command gratis (limit 0) yang paling berguna | semua |
| `.mintalimit` | `reqlimit` `mintalimit` | Minta tambahan limit ke owner | semua |
| `.saldoexp` | `expsaya` `jumlahexp` | Lihat total EXP & perbandingan dengan user lain | semua |
| `.statistikku` | `statsku` `pemakaianku` | Statistik pemakaian kamu di bot ini | semua |
| `.riwayatku` | `historiku` `commandterakhir` | 30 command terakhir yang kamu pakai | semua |
| `.topcmdku` | `favoritku` `commandfavorit` | 5 command yang paling sering kamu pakai | semua |
| `.rankku` | `peringkatku` `posisiku` | Peringkat kamu di leaderboard | semua |
| `.rankexp` | `leaderboardexp` `topexp` | Leaderboard EXP top 20 | semua |
| `.waktuku` | `aktifku` `lastseenku` | Kapan kamu pertama & terakhir aktif | semua |
| `.bandingkan` | `vs` `aduuser` | Bandingkan statistik kamu dengan user lain | semua |
| `.aktifkanstatistik` | `staton` | Nyalakan pencatatan statistik kamu | semua |
| `.autoaion` | `nyalaai` `aiotomatis` | Bot membalas chat kamu tanpa prefix (di chat ini) | semua |
| `.autoaioff` | `matiai` `matiautoai` | Matikan auto-reply AI untuk kamu | semua |
| `.setgayaai` | `gayaai` `styleai` | Atur gaya jawaban AI (santai/formal/lucu/singkat) | semua |
| `.lihatmemoriai` | `memoriai` `ingatanai` | Lihat konteks yang diingat AI tentang kamu | semua |
| `.hapusmemoriai` | `clearmemoriai` `resetmemori` | Hapus ingatan AI tentang kamu | semua |
| `.setbahasaai` | `bahasaai` | Pilih bahasa jawaban AI (id/en) | semua |
| `.aiprivasi` | `privasiai` | Lihat & atur data AI yang tersimpan tentang kamu | semua |
| `.pengingatku` | `pengingatlist` `lihatpengingat` | Daftar pengingat aktif kamu | semua |
| `.hapuspengingat` | `hapusreminderku` `batalkanpengingat` | Hapus pengingat berdasarkan nomor | semua |
| `.catat` | `tambahcatatan` `note` | Simpan catatan pribadi | semua |
| `.catatanku` | `listcatatan` `noteku` | Lihat semua catatan pribadi | semua |
| `.caricatatan` | `searchcatatan` `carinote` | Cari di catatan kamu | semua |
| `.hapuscatatan` | `delcatatan` `hapusnote` | Hapus catatan berdasarkan nomor | semua |
| `.simpanlink` | `bookmark` `savelink` | Simpan link penting | semua |
| `.linkku` | `listlink` `bookmarkku` | Lihat semua link tersimpan | semua |
| `.hargapremium` | `paketpremium` `listpremium` | Daftar paket premium & keuntungannya | semua |
| `.belipremium` | `orderpremium` `upgradepremium` | Ajukan pembelian premium ke owner | semua |
| `.kodepromo` | `redeem` `tukarkode` | Tukarkan kode promo premium/limit | semua |
| `.buatpromo` | `createpromo` `kodediskon` | Owner: buat kode promo | semua |
| `.cekban` | `diban` `statusban` | Cek apakah akun kamu sedang dibanned | semua |
| `.bandingban` | `appeal` `ajukanbanding` | Ajukan banding kalau merasa salah banned | semua |
| `.laporbug` | `bugreport` `laporerror` | Laporkan error/bug lengkap dengan info sistem | semua |
| `.saran` | `usulan` `feedback` | Kirim saran fitur ke owner | semua |
| `.matikanstatistik` | `statoff` | Hentikan pencatatan riwayat command kamu | semua |
| `.menuuser` | `usermenu` `menupersonal` | Buka menu user/personal lengkap | semua |
| `.cekuang` | `balance` `saldo` | Cek koin RPG kamu | semua |
| `.myid` | `idku` `nomorku` | Tampilkan nomor & JID kamu | semua |
| `.ceklevel` | `level` `levelku` | Cek level & EXP RPG kamu | semua |
| `.premcek` | `cekpremium` `premiumcek` | Cek status premium kamu | semua |
| `.req` | `request` `lapor` `report` | Kirim permintaan/laporan ke owner | semua |
| `.gantinama` | `namaku` `ubahnama` | Simpan nama kamu di database bot (ganti nama grup: .setname) | semua |
| `.wame` | `walink` `linkwa` | Link wa.me kamu atau orang yang ditag | semua |

---

## 🌟 Sticker Menu (63 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.stikerkutipan` | `quotestiker` `kutipanstiker` | Stiker berisi kutipan acak dari bank lokal | semua |
| `.stikernama` | `namestiker` `badgenama` | Stiker name-tag dengan namamu | semua |
| `.stikerperingatan` | `warningstiker` `stikerwarning` | Stiker tanda peringatan dengan teksmu | semua |
| `.stikerucapan` | `greetingstiker` `stikerselamat` | Stiker ucapan (pagi/siang/malam/ultah/dll) | semua |
| `.infostiker` | `stickerinfo,cekstiker` | Cek detail sebuah stiker/gambar | semua |
| `.stikerupscale` | `perbesarstiker,upscale` | Perbesar stiker/gambar ke 512px (upscale halus) | semua |
| `.stikerdownscale` | `perkecilstiker,downscale` | Perkecil stiker/gambar (hemat kuota) | semua |
| `.stikeracak` | `randomstiker` `stikerrandomteks` | Stiker teks acak lucu (tanpa input) | semua |
| `.stikersepia` | `sepia` `efeksepia` | Efek sepia (foto jadul kecokelatan) | semua |
| `.stikerpixelate` | `pixelate` `mosaik` | Efek piksel/mosaik (sensor) | semua |
| `.stikerthreshold` | `threshold` `hitamputihkeras` | Hitam-putih keras (threshold) | semua |
| `.stikerduotone` | `duotone` | Duotone 2 warna: .stikerduotone 1a1a2e e94560 | semua |
| `.stikerborder` | `bingkaistiker` `garispinggir` | Tambah bingkai warna: .stikerborder ffcc00 12 | semua |
| `.stikerrounded` | `sudutmembulat` `rounded` | Potong sudut membulat (transparan) | semua |
| `.stikervignette` | `vignette` | Efek vignette (sudut gelap) | semua |
| `.stikerwarm` | `warm` `hangat` | Nuansa hangat (kuning/oranye naik) | semua |
| `.stikercool` | `cool` `dingin` | Nuansa dingin (biru naik) | semua |
| `.stikerjadul` | `vintage` `oldphoto` | Efek foto jadul (sepia + vignette + noise) | semua |
| `.stikerhue` | `geserwarna` `hueshift` | Geser roda warna (derajat) | semua |
| `.stikersaturasi` | `saturate` `warnacerah` | Naikkan saturasi warna (0..100) | semua |
| `.stikerdesaturasi` | `desaturate` `warnapudar` | Pudarkan warna (0..100) | semua |
| `.stikerresize` | `ubahukuran` `resize` | Ubah ukuran (piksel, default 300) | semua |
| `.stikerkompres` | `perkecilgambar` `compress` | Perkecil ukuran file gambar (kualitas JPEG turun) | semua |
| `.stikerpersegi` | `squarepad` `jadipersegi` | Jadikan persegi dengan padding warna | semua |
| `.stikerteksatas` | `textoverlay` `tulisdigambar` | Tulis teks di atas gambar: .stikerteksatas HALO | semua |
| `.stikerwatermark` | `watermark` `tandaair` | Tambah watermark teks di pojok | semua |
| `.stikermeme` | `memestiker` `memeatas` | Stiker meme teks atas\|bawah | semua |
| `.stikercrop` | `croptengah` `potongtengah` | Potong jadi persegi dari tengah | semua |
| `.stikerkaleidoskop` | `mirror4` `kaleidoskop` | Cermin 4 arah (kaleidoskop) | semua |
| `.stikerlatarputih` | `whitebg` `latarputih` | Ganti area transparan jadi putih | semua |
| `.topng` | `konversipng` `jadipng` | Konversi gambar/stiker ke PNG | semua |
| `.tojpg` | `konversijpg` `jadijpeg` | Konversi ke JPG (ukuran lebih kecil) | semua |
| `.towebp` | `konversiwebp` `jadiwebp` | Konversi ke WEBP (stiker) | semua |
| `.tobase64img` | `imgbase64` `datauri` | Ubah gambar jadi data URI base64 | semua |
| `.infoimg` | `infogambar` `imageinfo` | Info gambar: ukuran, dimensi, mode warna | semua |
| `.warnadominan` | `dominantcolor` `warnautama` | Deteksi 5 warna dominan sebuah gambar | semua |
| `.ttpgradasi` | `textgradient` `stikergradasi` | Stiker teks dengan latar gradasi | semua |
| `.ttpoutline` | `textoutline` `teksgaris` | Stiker teks dengan garis tepi tebal | semua |
| `.ttpkotak` | `textbox` `tekskotak` | Stiker teks dalam kotak berwarna | semua |
| `.ttpbulat` | `textcircle` `teksbulat` | Stiker teks dengan latar lingkaran | semua |
| `.ttpneon` | `neontext` `teksneon` | Stiker teks efek neon (glow) | semua |
| `.ttpbayangan` | `textshadow` `teksbayangan` | Stiker teks dengan bayangan | semua |
| `.ttpbesar` | `bigtext` `teksbesar` | Stiker teks ukuran besar | semua |
| `.ttpkecil` | `smalltext` `tekskecil` | Stiker teks ukuran kecil | semua |
| `.ttprainbow` | `rainbowtext` `tekspelangi` | Stiker teks warna pelangi | semua |
| `.ttpstrip` | `stripedtext` `teksloreng` | Stiker teks latar loreng | semua |
| `.stikerhari` | `stikertanggal` `tanggalstiker` | Stiker otomatis bertuliskan tanggal hari ini | semua |
| `.stikerjam` | `jamstiker` `clockstiker` | Stiker otomatis bertuliskan jam sekarang | semua |
| `.attp` | `stikerteks` `textsticker` `ttpwarna` | Buat stiker teks berwarna (format: teks\|warnahex) | semua |
| `.sblur` | `stikerblur` `blur` | Stiker blur (default 4) | semua |
| `.sbright` | `stikerterang` `cerahkan` | Atur terang (-100..100, default 20) | semua |
| `.scircle` | `stikerbulat` `bulat` `lingkaran` | Potong stiker jadi lingkaran | semua |
| `.scontrast` | `stikerkontras` `kontras` | Atur kontras (-100..100, default 30) | semua |
| `.sflip` | `stikerflip` `mirror` `cermin` | Cerminkan stiker horizontal | semua |
| `.sflipv` | `stikerflipv` `balikvertikal` | Balik stiker vertikal | semua |
| `.sgaussian` | `stikergaussian` | Stiker gaussian blur halus | semua |
| `.sgray` | `stikergray` `grayscale` `hitamputih` | Stiker jadi hitam-putih | semua |
| `.sinvert` | `stikerinvert` `negatif` `negative` | Stiker negatif (warna terbalik) | semua |
| `.sopacity` | `stikertransparan` `transparan` | Atur transparansi (0-100, default 50) | semua |
| `.sposter` | `stikerposter` `posterize` | Efek poster (default 4 level) | semua |
| `.srotate` | `stikerputar` `putar` | Putar stiker (derajat, default 90) | semua |
| `.s` | `sticker` `stickergif` `sgif` `stikerimg` | Ubah gambar/video jadi stiker (reply/kirim media) | semua |
| `.stiker` | `stickertext` `ttp` `smeme` | Buat stiker dari teks | semua |

---

## 🤖 AI Menu (62 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.aiimg` | `imgai` `buatgambar` `text2img` `image` | Buat gambar dari teks (AI) | semua |
| `.airich` | `richdemo` `rich` | Demo AI Rich Message (teks, kode, tabel, saran) | semua |
| `.ai` | `chatgpt` `gpt` `ask` `tanya` `gemini` | Chat dengan AI (punya ingatan per chat) | semua |
| `.delmem` | `clearmem` `resetmem` `hapusmemory` | Hapus ingatan AI di chat ini | semua |
| `.persona` | `setpersona` `character` `aiinfo` | Lihat / ganti karakter AI (ganti = owner) | semua |
| `.tts` | `say` `voice` `speech` | Ubah teks jadi suara (AI voice) | semua |
| `.aijelaskan` | `jelaskanai` `explainai` | Jelaskan topik dengan bahasa sederhana | semua |
| `.aidefinisi` | `definisiai` `artikata` | Definisi sebuah kata/istilah | semua |
| `.airangkum` | `rangkumai` `summarizeai` | Rangkum teks panjang jadi poin penting | semua |
| `.aitulisulang` | `parafraseai` `rewriteai` | Tulis ulang teks agar lebih enak dibaca | semua |
| `.aiperbaiki` | `grammarai` `koreksiai` | Perbaiki ejaan/tata bahasa sebuah teks | semua |
| `.aisingkat` | `persingkat` `shorten` | Persingkat teks jadi 1-2 kalimat | semua |
| `.aiperpanjang` | `kembangkan` `expand` | Kembangkan teks pendek jadi paragraf | semua |
| `.aigaya` | `ubahgaya` `restyle` | Ubah gaya bahasa: formal/santai/puitis/lucu | semua |
| `.aiterjemahkan` | `translateai` `terjemahkanai` | Terjemahkan teks ke bahasa apa pun | semua |
| `.aiemoji` | `tambahemoji` `emojify` | Tambahkan emoji yang pas ke dalam teks | semua |
| `.aipuisi` | `puisiai` `buatpuisi` | Buat puisi dari tema | semua |
| `.aipantun` | `pantunai` `buatpantun` | Buat pantun sesuai tema | semua |
| `.aicerita` | `ceritaai` `buatcerita` | Buat cerita pendek dari premis | semua |
| `.aidongeng` | `dongengai` `ceritaanak` | Dongeng anak sebelum tidur | semua |
| `.ailirik` | `liriknya` `buatlirik` | Tulis lirik lagu (verse + chorus) | semua |
| `.aiskenario` | `naskahai` `scripts` | Buat naskah/skenario pendek | semua |
| `.aidialog` | `percakapan` `dialogai` | Buat dialog 2 tokoh tentang topik | semua |
| `.aikarakter` | `karakterai` `characterai` | Buat lembar karakter (untuk novel/game) | semua |
| `.aicaption` | `captionai` `bikincaption2` | Caption Instagram/TikTok dari deskripsi | semua |
| `.aihashtag` | `hashtagai` `tagai` | Hashtag relevan untuk sebuah topik | semua |
| `.aibio` | `bioig` `buatbio` | Ide bio Instagram/TikTok/WhatsApp | semua |
| `.aibuatstatus` | `statuswa` `buatstatus` | Status WhatsApp singkat & menarik | semua |
| `.aislogan` | `sloganai` `tagline` | Slogan/tagline untuk brand atau kegiatan | semua |
| `.ainamabisnis` | `namabrand` `namausaha` | Ide nama usaha/brand dari bidang | semua |
| `.ainamabayi` | `namabayi` `ideanama` | Ide nama bayi + artinya | semua |
| `.aideskripsiproduk` | `deskripsiproduk` `copywriting` | Deskripsi produk untuk jualan online | semua |
| `.aisoal` | `bikinkuis` `soalai` | Buat soal latihan dari sebuah topik | semua |
| `.aiesai` | `esai` `essayai` | Kerangka + esai dari judul | semua |
| `.aimakalah` | `makalahai` `kerangkamakalah` | Kerangka makalah/laporan | semua |
| `.aidebat` | `argumenai` `debatai` | Argumen pro & kontra sebuah isu | semua |
| `.aiprokontra` | `kelebihankekurangan` `plusminus` | Kelebihan & kekurangan sesuatu | semua |
| `.aiperbandingan` | `bandingkanai` `versus` | Perbandingan 2 hal secara terstruktur | semua |
| `.aibahasa` | `bahasadaerah` | Terjemahan ke bahasa daerah (Jawa/Sunda/Minang/dll) | semua |
| `.aikode` | `buatkode` `codeai` | Buat kode program dari deskripsi | semua |
| `.aijelaskankode` | `explaincode` `bedahkode` | Jelaskan potongan kode baris demi baris | semua |
| `.aidebug` | `caribug` `fixerror` | Cari & perbaiki bug/pesan error | semua |
| `.airegex` | `bikinregex` `polaregex` | Buat regex + penjelasan dari kebutuhan | semua |
| `.aisql` | `querysql` `bikinsql` | Buat query SQL dari kebutuhan | semua |
| `.aihtml` | `webhtml` `bikinhtml` | Buat potongan HTML/CSS siap pakai | semua |
| `.aiscript` | `scriptbot` `fiturbot` | Ide/kerangka script fitur WhatsApp bot | semua |
| `.airencana` | `itinerary` `rencanaperjalanan` | Rencana perjalanan/kegiatan per hari | semua |
| `.aijadwal` | `jadwalharian` `bikinjadwal` | Jadwal harian produktif dari daftar tugas | semua |
| `.aitarget` | `rencanagoal` `targetai` | Ubah tujuan jadi rencana langkah konkret | semua |
| `.aikeuangan` | `anggarankeuangan` `budgetai` | Saran anggaran dari pemasukan | semua |
| `.aimenu` | `menumakan` `resepmingguan` | Susun menu makan + resep sederhana | semua |
| `.ailatihan` | `workoutai` `olahragai` | Program latihan fisik dari kondisi | semua |
| `.ainasehat` | `saranku` `nasihatai` | Nasehat/saran untuk situasi tertentu | semua |
| `.aimotivasi` | `motivasiku` `semangatai` | Kalimat motivasi sesuai kondisimu | semua |
| `.aiclear` | `clearmemory` `resetmemory` `lupamemory` | Hapus ingatan AI untuk chat ini | semua |
| `.aimemory` | `lihatmemory` `memoryai` | Lihat ingatan AI chat ini | semua |
| `.aioff` | `matikanai` | Matikan auto-reply AI (global) | 👑 owner |
| `.aion` | `aionn` `nyalakanai` | Nyalakan auto-reply AI (global) | 👑 owner |
| `.airichtanya` | `tanyaairich` `airichai` `aiairich` | Tanya AI, jawaban dirender sebagai kartu AI Rich + pill lanjutan | semua |
| `.ringkas` | `summarize` `tl;dr` `paraphrase` `parafrase` | Ringkas atau tulis ulang teks | semua |
| `.translate` | `tr` `terjemah` | Terjemahkan teks (format: .tr id\|teks) | semua |
| `.autoai` | `toggleai` `aichat` | Nyalakan/matikan AI auto reply di chat ini | semua |

---

## 🌐 Internet (62 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.cuaca` | `weather` | Cek cuaca suatu kota | semua |
| `.google` | `gsearch` `cari` | Cari di Google / DuckDuckGo | semua |
| `.kurs` | `currency` `tukar` | Konversi mata uang (contoh: .kurs USD IDR 10) | semua |
| `.wiki` | `wikipedia` | Cari artikel Wikipedia Indonesia | semua |
| `.cekweb` | `httpstatus` `ishidup` `webcheck` | Cek status HTTP sebuah website | semua |
| `.expandurl` | `redirect` `unshort` | Lihat URL tujuan akhir setelah redirect | semua |
| `.headers` | `httphead` `cekheader` | Lihat header HTTP sebuah URL | semua |
| `.latency` | `pingweb` `latensi` | Ukur latensi ke sebuah host | semua |
| `.dns` | `dnslookup` `nslookup` | Lookup DNS lengkap (A, AAAA, NS, MX, TXT) | semua |
| `.dnsa` | `resolvea` `ipv4` | Resolve DNS record A (IPv4) | semua |
| `.dnsaaaa` | `resolveaaaa` `ipv6` | Resolve DNS record AAAA (IPv6) | semua |
| `.dnsmx` | `resolvemx` `mailserver` | Resolve MX (server email domain) | semua |
| `.dnstxt` | `resolvetxt` `spf` | Resolve TXT (SPF/DKIM/verifikasi) | semua |
| `.dnsns` | `resolvens` `nameserver` | Resolve NS (nameserver) | semua |
| `.dnscname` | `resolvecname` `alias` | Resolve CNAME (alias domain) | semua |
| `.dnssoa` | `resolvesoa` | Resolve SOA (otoritas zona) | semua |
| `.dnsptr` | `reverseip` `ptrdns` | Reverse DNS: IP → nama domain | semua |
| `.dnspublik` | `dnskustom` | Resolve lewat DNS publik tertentu: .dnspublik <domain> [server] | semua |
| `.resolveip` | `iptoip` `lookupip` | Resolve nama host → IP (sistem) | semua |
| `.pinghost` | `pingtcp` `cekping` | Ping TCP (ukur latency koneksi ke host) | semua |
| `.portcheck` | `cekport` `port` | Cek satu port terbuka/tertutup | semua |
| `.portscan` | `scanport` | Scan port umum pada host (≤20 port) | semua |
| `.sslinfo` | `cekssl` `sertifikat` | Info sertifikat SSL/TLS sebuah domain | semua |
| `.whois` | - | Data WHOIS domain (registrar, tanggal, nameserver) | semua |
| `.isup` | `cekup` `hidupkah` | Cek situs hidup/mati + waktu respons | semua |
| `.speedtest` | `cekspeed` `teskecepatan` | Ukur kecepatan unduh (server Cloudflare) | semua |
| `.urlparse` | `bedahurl` `parseurl` | Bedah komponen sebuah URL | semua |
| `.urljoin` | `gaburl` | Gabungkan URL dasar + path | semua |
| `.httpcode` | `kodehttp` `statushttp` | Ambil status code + header utama sebuah URL | semua |
| `.httpbody` | `gethtml` `sumberweb` | Ambil isi HTML/teks sebuah URL (maks 3000 karakter) | semua |
| `.httpredirect` | `redirectchain` `jejakurl` | Ikuti rantai redirect sebuah URL | semua |
| `.mimetype` | `tipefile` | Deteksi tipe file (MIME) dari URL | semua |
| `.filesize` | `ukuranfile` | Cek ukuran file dari URL (HEAD request) | semua |
| `.favicon` | `ikonweb` | Ambil favicon sebuah situs | semua |
| `.robotstxt` | `robots` | Lihat robots.txt sebuah situs | semua |
| `.oginfo` | `opengraph` `metaweb` | Ambil metadata Open Graph / judul & deskripsi situs | semua |
| `.webinfo` | `infohalaman` | Ringkasan halaman: judul, jumlah kata, gambar, link | semua |
| `.shortlink` | `pendekinurl` `tinyurl` | Perpendek URL (TinyURL) | semua |
| `.ipku` | `myip` `ippublik` | Lihat IP publik + lokasi bot ini | semua |
| `.ipgeo` | `lokasiip` `ipinfo` | Lacak lokasi & ISP sebuah IP | semua |
| `.ipcalc` | `cidr` `subnet` | Kalkulator IP/CIDR: network, broadcast, jumlah host | semua |
| `.subnetting` | `bagisubnet` | Pecah jaringan jadi beberapa subnet: .subnetting 192.168.1.0/24 4 | semua |
| `.ipacak` | `fakeip` `randomip` | Buat IP acak (untuk uji coba) | semua |
| `.portinfo` | `infoport` | Penjelasan sebuah nomor port | semua |
| `.emailcheck` | `cekemail` | Validasi format email + cek server MX-nya | semua |
| `.domaincheck` | `cekdomain` | Cek domain sudah terdaftar atau masih kosong | semua |
| `.dnspropagation` | `cekpropagasi` | Cek propagasi DNS lewat beberapa resolver publik | semua |
| `.dnsspeed` | `tesdns` | Bandingkan kecepatan resolver DNS publik | semua |
| `.useragent` | `randomua` `fakeua` | Buat User-Agent acak (untuk scraping) | semua |
| `.httpmethod` | `cekmethod` | Cek metode HTTP yang diizinkan sebuah URL | semua |
| `.securityheader` | `ceksecurity` `headerskor` | Audit header keamanan sebuah situs | semua |
| `.cekcdn` | `deteksicdn` | Deteksi CDN/WAF yang dipakai sebuah situs | semua |
| `.ceklatensi` | `latensimulti` | Ukur latency ke beberapa situs besar sekaligus | semua |
| `.ceksslchain` | `rantaisertifikat` | Lihat rantai sertifikat (chain) sebuah domain | semua |
| `.cekdnssec` | `dnssec` | Cek apakah domain memakai DNSSEC | semua |
| `.httpjson` | `getjson` `api` | Ambil & rapikan JSON dari sebuah API URL | semua |
| `.httpbin` | `testhttp` | Uji request HTTP lewat httpbin (echo header & IP) | semua |
| `.cekkoneksi` | `netcheck` `koneksiku` | Diagnosa koneksi internet bot (DNS, HTTPS, kecepatan) | semua |
| `.urlstatus` | `cekurlbanyak` | Cek status banyak URL sekaligus (pisah spasi) | semua |
| `.cekcache` | `cachecontrol` | Periksa header cache & umur konten sebuah URL | semua |
| `.cekkompres` | `gzip` | Cek dukungan kompresi (gzip/br) sebuah situs | semua |
| `.cekipv6` | `supportipv6` | Cek apakah domain mendukung IPv6 | semua |

---

## 🏠 Main Menu (57 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.allmenu` | `listmenu` `fitur` `commands` | Tampilkan semua fitur bot | semua |
| `.rules` | `aturan` `tos` | Aturan pemakaian bot | semua |
| `.donate` | `donasi` `sewa` `premium` | Donasi / sewa bot / premium | semua |
| `.listcmd` | `cmdlist` | Daftar perintah per kategori (teks) | semua |
| `.menutools` | `toolsmenu` `menuutilitas` | Menu Tools (104 fitur: konversi, encoder, kalkulator) | semua |
| `.menugames` | `gamesmenu` `menumain` | Menu Games (kuis, tebak-tebakan, mini game) | semua |
| `.menuai` | `menuaicerdas` `menukecerdasan` | Menu AI (chat, gambar, suara, terjemah) | semua |
| `.menustiker` | `stickermenu` `menustikerlengkap` | Menu Sticker (buat & edit stiker) | semua |
| `.menugrup` | `menugruplengkap` `menugrupsemua` | Menu Group (daftar SEMUA perintah kategori Group Menu) | semua |
| `.menuowner` | `ownermenu` `menudev` | Menu Owner (khusus developer/owner) | semua |
| `.menurpg` | `rpgmenu` `menupetualangan` | Menu RPG (petualangan, toko, dungeon, pet) | semua |
| `.menuinfo` | `infomenu` `menuinformasi` | Menu Info (berita, cuaca, kurs, wikipedia) | semua |
| `.menuinternet` | `netmenu` `menuweb` | Menu Internet (download, cek web, jaringan) | semua |
| `.menufun` | `funmenu` `menuhiburan` | Menu Fun (teks unik, tebak, ramalan seru) | semua |
| `.menudownload` | `dlmenu` `menudl` | Menu Downloader (video, gambar, file) | semua |
| `.menuadmin` | `adminmenu` `menuadmingrup` | Menu khusus admin grup (fitur yang butuh admin) | semua |
| `.menutombol` | `menubutton` `menubuttonlist` | Menu utama dalam bentuk tombol | semua |
| `.menulist` | `menudropdownlist` `menudropdown` | Menu utama dalam bentuk list/dropdown | semua |
| `.menuteks` | `textmenu` `menupolos` | Menu utama dalam bentuk teks biasa (hemat kuota) | semua |
| `.menukarusel` | `carousellmenu` `menugeser` | Menu utama dalam bentuk karusel (geser kartu) | semua |
| `.menuairich` | `airichmenu` `menukaya` | Menu utama dengan tampilan AI Rich (Meta AI style) | semua |
| `.menuapp` | `appmenu` `menuaplikasi` | Menu utama sebagai aplikasi HTML interaktif (cari & filter) | semua |
| `.menuringkas` | `menusingkat2` `menucompact` | Menu ringkas: 1 baris per kategori | semua |
| `.listkat` | `isikategori` `lihatkategori` | Lihat semua perintah satu kategori: .listkat <nama> | semua |
| `.panduan` | `petunjukpakai` `carapakai` | Panduan singkat cara memakai bot | semua |
| `.mulaicoba` | `onboarding` `pemula` | 5 perintah pertama yang wajib dicoba | semua |
| `.faq` | `tanyaumum` `pertanyaansering` | Pertanyaan yang paling sering ditanya | semua |
| `.carimenu` | `carimenu` `temukanfitur` | Cari fitur lewat kata kunci | semua |
| `.pintasan` | `shortcut` `perintahcepat` | Daftar pintasan perintah yang paling sering dipakai | semua |
| `.contohpenggunaan` | `contoh` `example` | Contoh pemakaian beberapa fitur populer | semua |
| `.infofitur` | `detailfitur` `bantuanfitur` | Bantuan detail satu fitur: .infofitur <nama> | semua |
| `.kamusperintah` | `glossary` `istilahbot` | Kamus istilah: limit, EXP, cooldown, premium, dsb. | semua |
| `.tipsbot` | `tips` `trik` | Tips & trik memaksimalkan bot | semua |
| `.kendalapertama` | `troubleshoot` `masalah` | Solusi masalah yang sering terjadi | semua |
| `.tutorial` | `bimbing` `caramain` | Tutorial bertahap dari nol sampai mahir | semua |
| `.bantuan` | `bantuancepat` `tolong` | Bantuan cepat (alias menu ringkas) | semua |
| `.semuaperintah` | `daftarfitur` `listfitur` | Daftar SEMUA perintah bot (teks panjang) | semua |
| `.versibot` | `cekversi` `versiterkini` | Versi bot saat ini | semua |
| `.changelog` | `perubahan` `riwayatversi` | Catatan perubahan tiap versi | semua |
| `.kreditbot` | `penghargaan` `kreditpembuat` | Kredit & sumber daya yang dipakai | semua |
| `.lisensi` | `license` | Lisensi & ketentuan pemakaian | semua |
| `.sumbercode` | `sourcecode` `kodebot` | Struktur kode bot ini | semua |
| `.carainstall` | `instalasi` `pasangbot` | Cara memasang bot ini di Termux (langkah lengkap) | semua |
| `.fiturunggulan` | `keunggulan` `fiturutama` | Fitur paling unggulan di bot ini | semua |
| `.statistikpublik` | `statpublik` `statistikbotpublik` | Statistik pemakaian bot secara keseluruhan | semua |
| `.updateinfo` | `infoupdate` `cekupdate` | Cara memperbarui bot ke versi terbaru | semua |
| `.kontak` | `contact` `hubungi` | Cara menghubungi owner/pembuat | semua |
| `.halo` | `hai` `hi` | Sapa bot dan dapat ringkasan cepat | semua |
| `.sapa` | `greet` | Sapa semua orang di grup | semua |
| `.tesbot` | `testbot` `cekrespons` | Cek apakah bot merespons | semua |
| `.cekbot` | `botstatuscepat` `botaktif` | Status bot: online, mode, beban | semua |
| `.grupresmi` | `grupofficial` `joingrup` | Info grup resmi bot | semua |
| `.undangbot` | `invitebot` `tambahbot` | Cara menambahkan bot ke grup kamu | semua |
| `.permintaanfitur` | `requestfitur` `mintafitur` | Ajukan permintaan fitur baru | semua |
| `.donasilain` | `dukungbot` `support` | Cara lain mendukung pengembangan bot | semua |
| `.menu` | `help` `?` `start` | Menampilkan menu utama bot | semua |
| `.owner` | `creator` | Menampilkan kontak owner bot | semua |

---

## 📦 Premium (13 perintah)

| Perintah | Alias | Keterangan | Akses |
|---|---|---|---|
| `.premmenu` | `menupremium` `menuprem` `premiumhub` `premhub` `premiummenu` | 👑 Menu premium: status, benefit & semua fitur eksklusif premium | semua |
| `.premclaim` | `claimpremium` `premdaily` `klaimpremium` `premharian` | 🎁 Klaim harian JUMBO khusus premium: +150 limit, +100.000 uang, +250 EXP | 💎 premium |
| `.premcard` | `kartupremium` `premiumcard` `goldcard` `kartuemas` `kartugold` | 🪪 Kartu member EMAS eksklusif premium (HTML app interaktif) | 💎 premium |
| `.premminggu` | `premweekly` `klaimpremiummingguan` `premweek` `weeklyprem` | 🗓 Klaim MINGGUAN jumbo khusus premium: +1.000 limit · +500.000 uang · +2.500 EXP | 💎 premium |
| `.prembulanan` | `premmonthly` `premmonth` `monthlyprem` `premmonthcl` | 🗓 Klaim BULANAN elit premium: +3.000 limit · +2.000.000 uang · +10.000 EXP | 💎 premium |
| `.prembuff` | `buffprem` `premx2` `prem2x` `buffharian` | ⚡ Buff 24 jam: klaim harian premium dibayar ×2 — `.prembuff on/off` | 💎 premium |
| `.premtransfer` | `premtflimit` `premtf` `transfree` `tflimitpremium` | 💸 Transfer limit ke teman TANPA fee (premium) — `.premtransfer @user 100` | 💎 premium |
| `.premvip` | `vipclaim` `jadivip` `prembadge` `badgevip` | ♛ Klaim badge VIP (harga hidup) namamu ada di leaderboard VIP premium | 💎 premium |
| `.listvip` | `vipboard` `vipleaderboard` `premviplist` | 📜 Leaderboard member VIP premium (uang+exp bagi semua premVip) | 💎 premium |
| `.premfont` | `fontprem` `premnamafont` `premnick` `fontnamaprem` | ✏️ Pasang font fancy untuk nama sendiri di kartu member — `.premfont gotik` · list: `.premfont list` | 💎 premium |
| `.premstyle` | `styleprem` `premcardstyle` `premwarna` `premtheme` | 🎨 Ubah warna aksen kartu membermu (per per pengguna) — `.premstyle laut` · daftar warna: `.premstyle list` | 💎 premium |
| `.premtop` | `premleaderboard` `lbprem` `topprem` `premtop3anggap` | 🏆 Top 50 member premium teraktif (EXP + uang, premium-gated) | 💎 premium |
| `.premhadian` | `premjutan` `premsurprise` `premgift` `premkecil` | 🎁 Hadiah kejutan harian khusus member premium (roll dengan hadiah terbatas, ekonomi tetap Aman) | 💎 premium |

---

_Dibuat: 6/9/2026, 05.55.43_
