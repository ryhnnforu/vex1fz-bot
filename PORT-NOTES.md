# PORT-NOTES — THERYHANN-BOT → vex1fz (Fase 2)

Catatan teknis untuk pemeliharaan. Baca ini sebelum menyentuh `vendor/` atau partisi.

## Arsitektur

```
vex1fz-bot/
├── vendor/theryhann/        ← runtime THB v7.37.1 DIJUAL UTUH (ESM)
│   ├── config.js            ← branding vex1fz, owner TETAP 6283199329104
│   ├── package.json         ← {"type":"module"} (semua dep resolusi dari node_modules root)
│   ├── handlers/message.js  ← initHandler / messageHandler / smsg / group+delete evt
│   ├── features/ (119)      ← plugins ber-`command` — 1655 perintah, 5719 alias
│   ├── lib/ (107)
│   ├── shims/elaina.mjs     ← re-export @japofc/baileys + AIRich cert static
│   ├── shims/opentype.mjs   ← opentype.js@1.3.4 asli (lib/tekstebal)
│   ├── shims/msedge-tts.mjs ← API kosong → THB jatuh ke gTTS internal
│   └── database-rt/, tmp/   ← runtime (DI-GITIGNORE)
├── lib/thbbridge.js         ← jembatan CJS: init/pump/pumpCounted/synthetic/menuSummary
└── commands/thb.js          ← .thbmenu (synthetic .menu) + .thbinfo
```

## Partisi pesan (ANTI DOBEL) — di index.js

1. `m.prefix === '.' && m.command` → kalau `registry.resolve(cmd)` ada → **vex1fz**; kalau THB punya & kita tidak → **THB pump**; tak dikenal dua-duanya → `handle()` vex1fz.
2. Teks polos (`!m.prefix`) → chatTrigger vex1fz → lalu `thb.pumpCounted()` (counter `sendMessage`+`relayMessage`): THB balas → **selesai**; tidak → AI vex1fz.
3. Prefix owner (`/`, `,`, `=>`) → selalu vex1fz.
4. `.thbmenu` → `pumpSynthetic('.menu')` → menu THB (list klasik via relayMessage).

## Kontrak penting

- **`thb.init(sock)`** dipanggil saat `connection === 'open'` → `initHandler(sock, [ownerNumber])` (sekali): scheduler + sewa interval otomatis. `modeKetat` default OFF → gate sewa tak memblokir.
- **`findPlugin(name)`** adalah sumber kebenaran partisi (sudah include alias).
- `pumpCounted` HARUS balikin `sendMessage`+`relayMessage` — menu THB pakai `relayMessage` (listMessage).
- THB punya antilink/antitoxic/spam sendiri: toggle default THB `antilink:false, antitoxic:false, antiSpam:false` — **plugin-existence DOBEL OK, toggle tidak double-fire**. Jangan nyalakan keduanya barengan (`.on antilink` = vex; `.setall` THB = ganda).
- AI: `config.ai.autoReply:false` THB → cuma perintah AI THB (`.ai` dll) yang reply; teks polos → AI vex1fz. **`.ai` adalah perintah THB** (dipartisi ke THB).
- DB THB terpisah: `database-rt/` (env `DATABASE_DIR`, fallback `/data/theryhann` di Railway).
- Smoke test vendor: import semua 227 file → **227/227 OK**; `loadPlugins` → 1655.
- Export fitur THB: `export default { command:[…], category, description, limit, cooldown, run(m, ctx) }` — `m.q/args/command/jid/reply`, ctx = `{sock, text, args, prefix, config, aiChat, reload…}`.

## Gate (wajib sebelum commit)

```
grep japofc package.json                       # @japofc/baileys 2.4.7-new
grep -c wrapInteractive lib/sender.js          # = 4
node --check index.js && node -e "require('./commands/index').count()"   # 266
git log --oneline -1
```

## Urutan sisa (lanjutan)

1. ✅ vendor+shims+smoke+bridge+partisi+menu (commit ini)
2. ⬜ Audit tumpang-tindih hook runtime (antilink vex vs THB saat keduanya ON; slowmode vs THB typing; hijack/revoke THB vs vex).
3. ⬜ Uji live via Termux: pair QR → `.thbmenu`, `.ping`, `.uno`, `.ai` (THB), `.play` → pastikan TANPA balasan ganda + state `.gamemode` vex tak diganggu.
4. ⬜ Patch batch-2 THB (tatang?, sewa `bolehLayani` sudah OK default off) — lihat patch yang belum masuk dari sesi awal.
5. ⬜ Rebuild zip + push (gabung pesan 1 & 2).
