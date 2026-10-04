/**
 * 📟 .createnomor — GENERATOR NOMOR TELEPON (v7.37.0)
 * ------------------------------------------------------------------
 *  Membuat NOMOR ACAK BERFORMAT BENAR untuk data uji, isian profil,
 *  uji validasi input, dan menyaring nomor yang masih kosong dari sebuah
 *  daftar (.createnomorcek).
 *
 *  ⚠️ PENTING — nomor hasil generator adalah STRING ACAK: tidak ada SIM
 *  di baliknya, tidak bisa menerima SMS/OTP, jadi TIDAK BISA dipakai
 *  login WhatsApp. Nomor yang bisa login hanya dari operator (SIM/eSIM
 *  resmi) atau penyedia nomor resmi, lalu ditautkan ke bot pakai pairing.
 *
 *  .createnomor [jumlah] [target]       default 5 nomor Indonesia acak
 *  .createnomorid [jumlah] [operator]   khusus satu operator Indonesia
 *  .createnomornegara <kode> [jumlah]   nomor luar negeri (250 negara)
 *  .createnomorcek [jumlah|nomor…]      generator + cek terdaftar di WA
 *  .createnomoropsi                     daftar operator & contoh kode
 *
 *  Aturan argumen: angka pertama selalu dibaca sebagai JUMLAH (1–500),
 *  sisanya target (nama operator / kode negara).
 *  Contoh: `.createnomor 10 telkomsel` · `.createnomornegara us 8`
 */
import { config } from '../config.js'
import { countries } from '../lib/datasets.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const MAKS_BATCH = 500
const MAKS_CEK = 25
const BATAS_TEKS = 40

/** prefix resmi tiap operator Indonesia (08xx) */
export const OPERATOR = {
  telkomsel: { nama: 'Telkomsel', prefix: ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'] },
  indosat: { nama: 'Indosat (IM3/Mentari)', prefix: ['0814', '0815', '0816', '0855', '0856', '0857', '0858'] },
  xl: { nama: 'XL Axiata', prefix: ['0817', '0818', '0819', '0859', '0877', '0878'] },
  axis: { nama: 'Axis', prefix: ['0831', '0832', '0833', '0838'] },
  tri: { nama: 'Tri (3)', prefix: ['0895', '0896', '0897', '0898', '0899'] },
  smartfren: { nama: 'Smartfren', prefix: ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'] }
}

const ALIAS_OP = {
  im3: 'indosat', mentari: 'indosat', ioih: 'indosat', ooredoo: 'indosat',
  three: 'tri', '3': 'tri', tri3: 'tri', hutchison: 'tri',
  byu: 'telkomsel', simpati: 'telkomsel', asap: 'telkomsel',
  xlaxiata: 'xl', axisxl: 'axis', smart: 'smartfren', fren: 'smartfren'
}

/** panjang nomor NASIONAL (tanpa kode panggil, tanpa 0 di depan) per negara */
export const PANJANG_NEGARA = {
  id: [9, 12], us: [10, 10], ca: [10, 10], gb: [10, 10], au: [9, 9], nz: [9, 10],
  my: [9, 10], sg: [8, 8], th: [9, 9], ph: [10, 10], vn: [9, 10], kh: [8, 9],
  la: [9, 9], mm: [8, 10], in: [10, 10], pk: [10, 10], bd: [10, 10], lk: [9, 9],
  np: [10, 10], jp: [10, 11], kr: [9, 10], cn: [11, 11], tw: [9, 9], hk: [8, 8],
  sa: [9, 9], ae: [9, 9], qa: [8, 8], kw: [8, 8], eg: [10, 10], tr: [10, 10],
  ir: [10, 10], iq: [10, 10], de: [10, 11], fr: [9, 9], nl: [9, 9], be: [9, 9],
  it: [9, 11], es: [9, 9], pt: [9, 9], pl: [9, 9], ru: [10, 10], ua: [9, 9],
  br: [10, 11], mx: [10, 10], ar: [10, 11], cl: [9, 9], co: [10, 10], pe: [9, 9],
  za: [9, 9], ng: [10, 10], ke: [9, 9], ma: [9, 9], dz: [9, 9], tn: [8, 8]
}

/**
 * Koreksi kode panggil. data/countries.json menyimpan nomor NANP beserta kode
 * area (AS "+1201", Kanada "+1204", Jamaika "+1876", Åland "+35818") — 31 entri
 * tidak wajar. Tabel ini menimpanya dengan kode negara E.164 yang benar.
 */
export const KOREKSI_KODE = {
  us: '+1', ca: '+1', pr: '+1', do: '+1', jm: '+1', tt: '+1', bs: '+1', bb: '+1',
  ai: '+1', ag: '+1', dm: '+1', gd: '+1', ky: '+1', ms: '+1', vg: '+1', vi: '+1',
  gu: '+1', mp: '+1', bm: '+1', lc: '+1', vc: '+1', kn: '+1', tc: '+1', ax: '+358'
}

/** digit pertama nomor nasional yang pasti (ID: seluler selalu 8) */
export const AWALAN_NEGARA = { id: '8' }

const acak = (min, maks) => min + Math.floor(Math.random() * (maks - min + 1))
const pilih = arr => arr[Math.floor(Math.random() * arr.length)]
const digit = n => Array.from({ length: Math.max(0, n) }, () => Math.floor(Math.random() * 10)).join('')
const clamp = (n, min, maks) => Math.max(min, Math.min(maks, n))
/** pecah deret digit jadi kelompok enak dibaca: 9→3-3-3, 10→3-3-4, lainnya 4-4 */
export function kelompok (s) {
  const n = String(s).length
  if (n === 9) return [String(s).slice(0, 3), String(s).slice(3, 6), String(s).slice(6)]
  if (n === 10) return [String(s).slice(0, 3), String(s).slice(3, 6), String(s).slice(6)]
  return String(s).match(/.{1,4}/g) || [String(s)]
}

/** "0812-3456-7890" / "+1 2018-4864-43" biar enak dibaca */
export function hias (nomor, kode = '') {
  const s = String(nomor)
  if (kode && s.startsWith(kode) && s.length > kode.length) {
    const nas = s.slice(kode.length)
    return kode + ' ' + kelompok(nas).join('-')
  }
  const plus = s.startsWith('+')
  const inti = plus ? s.slice(1) : s
  const grup = inti.match(/.{1,4}/g) || []
  return (plus ? '+' : '') + grup.join('-')
}

/** nama operator dari teks bebas ("im3", "Telkomsel", "3") → kunci OPERATOR */
export function operatorDari (teks) {
  const k = String(teks || '').toLowerCase().trim()
  if (!k) return null
  if (OPERATOR[k]) return k
  if (ALIAS_OP[k]) return ALIAS_OP[k]
  return Object.keys(OPERATOR).find(o => OPERATOR[o].nama.toLowerCase().includes(k)) || null
}

/** satu nomor Indonesia: { nomor, operator, kodeOp } */
export function buatNomorId (operator = 'acak', panjang = 12) {
  const key = (operator && OPERATOR[operator]) ? operator : pilih(Object.keys(OPERATOR))
  const pref = pilih(OPERATOR[key].prefix)
  const sisa = clamp((Number(panjang) || 12) - 4, 6, 9)
  return { nomor: pref + digit(sisa), operator: OPERATOR[key].nama, kodeOp: key }
}

/** cari negara dari cca2/cca3/kode panggil/nama (id, usa, +62, indonesia) */
export function cariNegara (teks) {
  const k = String(teks || '').toLowerCase().trim().replace(/^\+/, '')
  if (!k) return null
  const list = countries() || []
  return list.find(c => String(c.cca2 || '').toLowerCase() === k) ||
    list.find(c => String(c.cca3 || '').toLowerCase() === k) ||
    list.find(c => String(c.kode || '').replace('+', '') === k) ||
    list.find(c => String(c.id || '').toLowerCase() === k) ||
    list.find(c => String(c.nama || '').toLowerCase() === k) || null
}

/** satu nomor luar negeri: { nomor, negara, bendera, kode } — null bila negara tak dikenal */
export function buatNomorNegara (teks, panjang = 0) {
  const n = cariNegara(teks)
  if (!n) return null
  const cca = String(n.cca2 || '').toLowerCase()
  const [min, maks] = PANJANG_NEGARA[cca] || [8, 10]
  const len = Number(panjang) > 0 ? clamp(Number(panjang), min, maks) : acak(min, maks)
  const kode = KOREKSI_KODE[cca] || n.kode
  if (!kode) return null
  const awal = AWALAN_NEGARA[cca] || String(acak(1, 9))
  return {
    nomor: `${kode}${awal}${digit(len - awal.length)}`,
    negara: n.id || n.nama, bendera: n.bendera || '', kode, cca2: cca
  }
}

/** urai argumen: angka pertama = jumlah, sisanya target */
export function uraiArgs (args, jumlahDefault = 5) {
  let jumlah = 0
  const target = []
  for (const a of (Array.isArray(args) ? args : [])) {
    const s = String(a).trim()
    if (!s) continue
    if (!jumlah && /^\d{1,3}$/.test(s)) { jumlah = parseInt(s, 10); continue }
    target.push(s)
  }
  return { jumlah: clamp(jumlah || jumlahDefault, 1, MAKS_BATCH), target: target.join(' ').toLowerCase() }
}

/** bikin N nomor unik sesuai target (operator / negara) */
export function buatBatch (jumlah, target) {
  const op = operatorDari(target)
  const mode = op ? `operator ${OPERATOR[op].nama}` : (cariNegara(target) ? `negara ${cariNegara(target).id}` : 'Indonesia acak')
  const pakaiNegara = !op && !!cariNegara(target)
  const lihat = new Set()
  const hasil = []
  let coba = 0
  while (hasil.length < jumlah && coba < jumlah * 20 + 50) {
    coba++
    const satu = pakaiNegara ? buatNomorNegara(target) : buatNomorId(op || 'acak')
    if (!satu || lihat.has(satu.nomor)) continue
    lihat.add(satu.nomor)
    hasil.push(satu)
  }
  return { hasil, mode, negara: pakaiNegara }
}

const DISCLAIMER =
  '⚠️ Nomor di atas *acak* dan tidak terdaftar — tidak punya SIM, jadi tidak bisa menerima OTP dan *tidak bisa dipakai login WhatsApp*.\n' +
  `Butuh akun tambahan yang bisa login? pakai nomor yang kamu pegang sendiri, lalu tautkan ke bot lewat pairing code.`

/** argumen berupa nomor eksplisit (untuk .createnomorcek) */
export function nomorEksplisit (args) {
  const out = []
  for (const a of (Array.isArray(args) ? args : [])) {
    const s = String(a).replace(/[^\d+]/g, '')
    if (/^\+?\d{7,15}$/.test(s)) out.push(s.replace(/^\+/, ''))
  }
  return [...new Set(out)]
}

async function jalankan (m, paksaNegara = false, modeCek = false) {
  const args = m.args || []
  const { jumlah, target } = uraiArgs(args)

  /* .createnomorcek 628123… → cek nomor yang ditulis, bukan mengacak */
  if (modeCek) {
    const daftar = nomorEksplisit(args)
    if (daftar.length) return kirimCek(m, daftar.slice(0, MAKS_CEK), 'nomor yang kamu tulis')
  }

  if (paksaNegara && !cariNegara(target)) {
    return m.reply(
      `🌍 *CREATENOMOR NEGARA*\n\n` +
      `Negara "${target || '-'}" tidak dikenal.\n\n` +
      `Cara: \`${P}createnomornegara <kode> [jumlah]\`\n` +
      `Contoh: \`${P}createnomornegara us 8\` · \`${P}createnomornegara my\` · \`${P}createnomornegara +62 3\`\n\n` +
      `Kode boleh: 2 huruf (\`us\`), 3 huruf (\`usa\`), kode panggil (\`+62\`), atau nama (\`indonesia\`).\n` +
      `Data: ${countries()?.length || 0} negara.`
    )
  }

  if (target && !operatorDari(target) && !cariNegara(target)) {
    return m.reply(
      `❌ Target "${target}" tidak dikenal.\n\n` +
      `Operator: ${Object.keys(OPERATOR).join(', ')}\n` +
      `Negara: 2/3 huruf, kode panggil, atau nama — contoh \`us\`, \`usa\`, \`+62\`, \`malaysia\`\n\n` +
      `Lihat semua: \`${P}createnomoropsi\``
    )
  }

  const { hasil, mode } = buatBatch(jumlah, target)
  if (!hasil.length) return m.reply('❌ Gagal membuat nomor. Coba lagi atau kecilkan jumlahnya.')

  await m.react?.('📟').catch(() => {})
  const baris = hasil.map((x, i) => `${i + 1}. ${hias(x.nomor, x.kode)}${x.operator ? ` · ${x.operator}` : ''}`)

  if (modeCek) return kirimCek(m, hasil.map(x => x.nomor.replace(/^\+/, '')), mode)

  const kepala = `📟 *CREATENOMOR — ${hasil.length} NOMOR*\nMode: ${mode}\n\n`
  const teks = kepala + baris.join('\n') + `\n\n${DISCLAIMER}`

  if (hasil.length > BATAS_TEKS) {
    const isi = `# THERYHANN! — ${hasil.length} nomor (${mode})\n` +
      `# dibuat ${new Date().toLocaleString('id-ID')}\n` +
      `# nomor acak, tidak terdaftar, tidak bisa dipakai login WhatsApp\n\n` +
      hasil.map(x => `${x.nomor}${x.operator ? '\t' + x.operator : ''}`).join('\n')
    await m.sendDoc(Buffer.from(isi, 'utf8'), `createnomor-${hasil.length}.txt`, 'text/plain').catch(() => {})
    return m.reply(
      kepala + baris.slice(0, 10).join('\n') +
      `\n… dan ${hasil.length - 10} nomor lagi di file .txt di atas.\n\n${DISCLAIMER}`
    )
  }
  return m.sendButtons({
    title: `📟 ${hasil.length} nomor (${mode})`,
    text: teks,
    footer: config.bot.footer,
    buttons: [
      { text: '🔎 Cek di WhatsApp', id: `${P}createnomorcek ${jumlah} ${target}`.trim() },
      { text: '🎲 Acak lagi', id: `${P}createnomor ${jumlah} ${target}`.trim() },
      { text: '🌍 Nomor luar negeri', id: `${P}createnomornegara us 5` },
      { text: 'ℹ️ Daftar operator', id: `${P}createnomoropsi` }
    ]
  }).catch(() => m.reply(teks))
}

/** cek nomor di WhatsApp lewat sock.onWhatsApp() */
async function kirimCek (m, daftar, mode) {
  if (!daftar.length) return m.reply(`❌ Tidak ada nomor untuk dicek.\nCara: \`${P}createnomorcek 5 telkomsel\` atau \`${P}createnomorcek 628123456789\``)
  await m.react?.('🔎').catch(() => {})
  const sock = m.sock
  let hasil = null
  if (typeof sock?.onWhatsApp === 'function') {
    try { hasil = await sock.onWhatsApp(...daftar.map(n => `${n}@s.whatsapp.net`)) } catch (e) { console.error('[createnomor] onWhatsApp:', e.message) }
  }
  if (!hasil) {
    return m.reply(
      `⚠️ Cek WhatsApp gagal (bot belum tersambung / usync ditolak).\n\n` +
      `Nomor yang diminta (${daftar.length}):\n${daftar.slice(0, MAKS_CEK).map((n, i) => `${i + 1}. ${hias(n)}`).join('\n')}`
    )
  }
  /* onWhatsApp hanya mengembalikan nomor yang PUNYA akun → sisanya berarti kosong */
  const ada = new Set(hasil.filter(x => x?.exists !== false).map(x => String(x?.jid || '').split('@')[0].split(':')[0]))
  const kosong = daftar.filter(n => !ada.has(n))
  const baris = daftar.map((n, i) => `${i + 1}. ${hias(n)} ${ada.has(n) ? '✅ TERDAFTAR' : '⬜ kosong'}`)
  return m.reply(
    `🔎 *CEK NOMOR DI WHATSAPP*\nMode: ${mode}\n\n` +
    baris.join('\n') +
    `\n\nRingkas: *${ada.size} terdaftar* · *${kosong.length} kosong* (dari ${daftar.length})\n` +
    (kosong.length ? `\nNomor kosong: ${kosong.slice(0, 10).map(hias).join(', ')}${kosong.length > 10 ? '…' : ''}\n` : '') +
    `\nℹ️ "Kosong" = belum ada akun WhatsApp. Nomor hasil generator tetap tidak bisa didaftarkan tanpa SIM asli.`
  )
}

export const createNomor = {
  command: ['createnomor', 'buatnomor', 'buatinomor', 'genenomor', 'nomoracak', 'nomorrandom', 'createnumber'],
  category: 'Tools',
  description: '📟 Generator nomor acak berformat benar (operator ID / 250 negara) — `.createnomor 10 telkomsel`',
  limit: 1,
  cooldown: 4,
  contoh: '10 telkomsel',
  run: m => jalankan(m, false, false)
}

export const createNomorId = {
  command: ['createnomorid', 'nomorid', 'nomoroperator'],
  category: 'Tools',
  description: '📟 Generator nomor per operator Indonesia — `.createnomorid 5 im3`',
  limit: 1,
  cooldown: 4,
  contoh: '5 im3',
  run: m => jalankan(m, false, false)
}

export const createNomorNegara = {
  command: ['createnomornegara', 'createnomordunia', 'nomornegara', 'nomorluar'],
  category: 'Tools',
  description: '🌍 Generator nomor luar negeri (250 negara) — `.createnomornegara us 8`',
  limit: 1,
  cooldown: 4,
  contoh: 'us 8',
  run: m => jalankan(m, true, false)
}

export const createNomorCek = {
  command: ['createnomorcek', 'ceknomorwa', 'ceknomor', 'nomorterdaftar'],
  category: 'Tools',
  description: '🔎 Cek nomor terdaftar di WhatsApp / saring yang masih kosong — `.createnomorcek 10`',
  limit: 1,
  cooldown: 8,
  contoh: '10 telkomsel',
  run: m => jalankan(m, false, true)
}

export const createNomorOpsi = {
  command: ['createnomoropsi', 'opsicreatenomor', 'listoperator'],
  category: 'Tools',
  description: 'ℹ️ Daftar operator & contoh kode negara untuk .createnomor',
  limit: 0,
  cooldown: 3,
  run: m => {
    const ops = Object.entries(OPERATOR).map(([k, v]) => `• *${v.nama}* — \`${k}\`\n  prefix: ${v.prefix.join(', ')}`).join('\n')
    const contoh = ['id', 'us', 'my', 'sg', 'gb', 'jp', 'kr', 'in', 'sa', 'de', 'br', 'au']
      .map(k => { const n = cariNegara(k); if (!n) return ''; const ko = KOREKSI_KODE[String(n.cca2 || '').toLowerCase()] || n.kode; return `${n.bendera || ''} ${k}=${ko}` }).filter(Boolean).join('  ')
    return m.reply(
      `ℹ️ *OPSI .createnomor*\n\n` +
      `*Operator Indonesia*\n${ops}\n\n` +
      `*Negara* (total ${countries()?.length || 0}) — contoh:\n${contoh}\n` +
      `Kode negara boleh 2 huruf, 3 huruf, kode panggil, atau nama: \`us\`, \`usa\`, \`+62\`, \`malaysia\`\n\n` +
      `*Contoh perintah*\n` +
      `\`${P}createnomor 10\` — 10 nomor ID acak\n` +
      `\`${P}createnomorid 5 telkomsel\` — khusus Telkomsel\n` +
      `\`${P}createnomornegara us 8\` — 8 nomor Amerika\n` +
      `\`${P}createnomorcek 10 tri\` — acak 10 lalu cek di WA\n` +
      `\`${P}createnomorcek 628123456789\` — cek nomor tertentu\n\n` +
      `${truncate(DISCLAIMER, 400)}`
    )
  }
}

export default { createNomor, createNomorId, createNomorNegara, createNomorCek, createNomorOpsi }
