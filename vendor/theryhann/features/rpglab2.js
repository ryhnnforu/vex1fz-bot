/**
 * ⚔️ RPGLAB2 (v7) — 33 fitur RPG lanjutan: JOB, SKILL, GUILD, WORLD BOSS
 * ---------------------------------------------------------------------
 *  Semua sistem ini membaca `lib/rpg7.js → stat7()`, jadi bonus job, skill,
 *  permata, relik, buff makanan, rumah, dekorasi, rebirth, dan musim
 *  MENUMPUK ke ATK/DEF/HP/crit/luck yang dipakai battle, dungeon, arena,
 *  world boss, dan panen.
 *
 *  JOB      → 6 kelas (Warrior/Mage/Archer/Assassin/Farmer/Healer) + skill aktif
 *  SKILL    → 12 skill pasif 3 cabang (Serang/Tahan/Untung), poin dari level
 *  GUILD    → database/guilds.json: bendahara, level, misi mingguan, anggota
 *  WORLD BOSS → database/worldboss.json: HP bersama, kontribusi, hadiah
 */
import { config } from '../config.js'
import { kartuGuildBaru } from '../lib/kartuanim.js'
import { kirimKartu } from './kartuanim.js'
import { truncate, pickRandom } from '../lib/functions.js'
import { saveDB, loadDB, allUsers, getUser } from '../lib/database.js'
import { addMoney, addExp, addItem, takeItem, ITEMS, getRPG } from '../lib/rpg.js'
import {
  P, K, R7, R7jid, simpan, catat7, stat7, buffAktif, biayaEnergi, koinHadiah, expHadiah,
  kartu7, kirimKartu7, bar7, butuhEnergi, fmt, HARI, MINGGU,
  JOBS, JOB_SKILL, SKILLS, guildDB, simpanGuild, cariGuild, guildDariId, levelGuild, anggotaGuild,
  BOSSES, bossDB, infoBoss, musimIni, cariId
} from '../lib/rpg7.js'

const rpg7 = (command, aliases, description, run, contoh = '', opt = {}) => ({
  command: [command, ...aliases],
  category: 'RPG Menu',
  description,
  limit: 0,
  cooldown: 3,
  contoh,
  ...opt,
  run: async m => {
    try { return await run(m) } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 220)}`) }
  }
})

const judulJob = st => `${st.job ? `${st.job.icon} ${st.job.nama}` : '👤 Tanpa kelas'}`

/* ================================================================== */
/*  A. JOB / KELAS (8)                                                 */
/* ================================================================== */
export const jobCmds = [
  rpg7('jobinfo', ['daftarjob', 'listjob', 'kelasinfo'], 'Daftar 6 kelas/job RPG + bonus & syaratnya', m => {
    const st = stat7(K(m))
    const rows = Object.entries(JOBS).map(([id, j]) =>
      `*${j.icon} ${j.nama}* (\`${P}pilihjob ${id}\`)\n▸ ${j.desc}\n▸ ATK ${Math.round((j.atk - 1) * 100) >= 0 ? '+' : ''}${Math.round((j.atk - 1) * 100)}% · DEF ${Math.round((j.def - 1) * 100)}% · HP +${j.hp} · crit ${Math.round(j.crit * 100)}% · energi ${j.energi < 1 ? '-' + Math.round((1 - j.energi) * 100) + '%' : '+' + Math.round((j.energi - 1) * 100) + '%'} · loot +${Math.round((j.loot - 1) * 100)}%\n▸ Skill: ${JOB_SKILL[id].icon} *${JOB_SKILL[id].nama}* — ${JOB_SKILL[id].desc}\n▸ Syarat: Lv.${j.minLevel}${st.r.level < j.minLevel ? ' ❌' : ' ✅'}`)
    const teks = `🎭 *KELAS / JOB RPG v7*\n\nKelas kamu sekarang: ${judulJob(st)}\nLevel: ${st.r.level} · Poin skill: ${st.r.skill.poin}\n\n${rows.join('\n\n')}\n\nGanti kelas: \`${P}gantijob <id>\` (5.000 koin)`
    return m.sendList({
      title: '🎭 Daftar Job RPG',
      text: truncate(teks, 3000),
      footer: config.bot.footer,
      buttonText: '🎭 Pilih Job',
      sections: [{
        title: 'Kelas tersedia',
        rows: Object.entries(JOBS).map(([id, j]) => ({ title: `${j.icon} ${j.nama} (Lv.${j.minLevel}+)`, description: j.desc, id: `${P}pilihjob ${id}` }))
      }]
    }).catch(() => m.reply(teks))
  }),

  rpg7('pilihjob', ['ambiljob', 'setjob', 'jadikelas'], 'Pilih kelas/job karakter (sekali, gratis)', m => {
    const r = R7(m)
    const id = cariId(JOBS, m.args?.[0])
    if (!id || !JOBS[id]) return m.reply(`Sebutkan kelasnya.\n\nPilihan: ${Object.keys(JOBS).join(', ')}\nContoh: \`${P}pilihjob warrior\`\nDetail: \`${P}jobinfo\``)
    if (r.job) return m.reply(`Kamu sudah punya kelas *${JOBS[r.job].icon} ${JOBS[r.job].nama}*.\n\nGanti (5.000 koin): \`${P}gantijob ${id}\``)
    if (r.level < JOBS[id].minLevel) return m.reply(`❌ Butuh Lv.${JOBS[id].minLevel} untuk jadi ${JOBS[id].nama}. Level kamu: ${r.level}.`)
    r.job = id
    catat7(r, `memilih job ${JOBS[id].nama}`)
    simpan()
    const s7 = stat7(K(m))
    return m.reply(`🎭 *KELAS DIPILIH: ${JOBS[id].icon} ${JOBS[id].nama}*\n\n${JOBS[id].desc}\n\n📊 Statistik baru:\n▸ ⚔️ ATK: *${s7.atk}*\n▸ 🛡️ DEF: *${s7.def}*\n▸ ❤️ HP maks: +${JOBS[id].hp}\n▸ 🎯 Crit: ${Math.round(s7.crit * 100)}%\n▸ ⚡ Biaya energi: ${Math.round(s7.energi * 100)}%\n\nSkill khusus: \`${P}skilljob\` → ${JOB_SKILL[id].icon} ${JOB_SKILL[id].nama} (${JOB_SKILL[id].desc})`)
  }, 'warrior'),

  rpg7('jobku', ['kelasaku', 'jobstatus'], 'Lihat kelas, skill aktif, dan statistik turunan', async m => {
    const st = stat7(K(m))
    const r = st.r
    const sk = r.job ? JOB_SKILL[r.job] : null
    const cd = sk ? Math.max(0, (r.jobSkillTerakhir || 0) + 600000 - Date.now()) : 0
    const teks = `🎭 *KELAS KARAKTER*\n\n${judulJob(st)} · Lv.${r.level}\n${st.job ? st.job.desc : `Pilih kelas: ${P}jobinfo`}\n\n*Skill khusus:* ${sk ? `${sk.icon} ${sk.nama} — ${sk.desc}` : '-'}\nCooldown: ${cd ? `${Math.ceil(cd / 60000)} menit` : '✅ siap'}\n\n*Statistik (termasuk semua bonus):*\n▸ ⚔️ ATK ${st.atk} · 🛡️ DEF ${st.def} · ❤️ HP ${r.health}/${st.maxHealth}\n▸ 🎯 Crit ${Math.round(st.crit * 100)}% · 🍀 Luck ${st.luck.toFixed(2)}× · 💰 Koin ${st.koin.toFixed(2)}×\n▸ ⚡ Energi ${Math.round(st.energi * 100)}% biaya · 💗 Regen ${Math.round(st.regen * 100)}% · 🌾 Panen ${Math.round(st.panen * 100)}%\n▸ 🐉 Damage boss +${Math.round(st.dmgBoss * 100)}%\n\n*Buff aktif:* ${buffAktif(r).length ? buffAktif(r).map(b => `${b.icon || '✨'} ${b.nama} (${Math.ceil((b.sampai - Date.now()) / 60000)} mnt)`).join(', ') : '-'}\nPoin skill: ${r.skill.poin} → ${P}skill`
    const buf = await kartu7(m, { judul: `${st.job ? st.job.icon : '🎭'} ${st.job ? st.job.nama : 'Tanpa Kelas'}`, sub: `Lv.${r.level} · ATK ${st.atk} · DEF ${st.def} · Crit ${Math.round(st.crit * 100)}%`, footer: `${config.bot.name} · RPG v7`, tema: 'sunset', kataBg: st.job === 'mage' ? 'magic,wizard' : st.job === 'archer' ? 'archery,forest' : st.job === 'farmer' ? 'farm,wheat' : 'knight,armor' })
    return kirimKartu7(m, buf, teks, { title: '🎭 Job', buttons: [{ text: '🎯 Pakai Skill Job', id: `${P}skilljob` }, { text: '🌳 Skill Tree', id: `${P}skill` }, { text: '🎭 Ganti Kelas', id: `${P}jobinfo` }] })
  }),

  rpg7('gantijob', ['ubahjob', 'pindahjob', 'respecjob'], 'Ganti kelas (biaya 5.000 koin)', m => {
    const r = R7(m)
    const id = cariId(JOBS, m.args?.[0])
    if (!id || !JOBS[id]) return m.reply(`Contoh: \`${P}gantijob mage\`\nPilihan: ${Object.keys(JOBS).join(', ')}`)
    if (r.job === id) return m.reply(`Kamu sudah jadi ${JOBS[id].nama}.`)
    if (r.level < JOBS[id].minLevel) return m.reply(`❌ Butuh Lv.${JOBS[id].minLevel} untuk ${JOBS[id].nama}. Level kamu: ${r.level}.`)
    if (!r.job) return m.reply(`Kamu belum punya kelas. Pilih gratis dulu: \`${P}pilihjob ${id}\``)
    if ((r.money || 0) < 5000) return m.reply(`❌ Butuh 5.000 koin untuk ganti kelas. Punya: ${fmt(r.money)}.`)
    r.money -= 5000
    const lama = r.job ? JOBS[r.job].nama : 'tanpa kelas'
    r.job = id
    catat7(r, `ganti job ${lama} → ${JOBS[id].nama}`)
    simpan()
    return m.reply(`🔄 *KELAS DIGANTI*\n\n${lama} → *${JOBS[id].icon} ${JOBS[id].nama}*\n\n-${fmt(5000)} koin · sisa ${fmt(r.money)}\n${JOBS[id].desc}\n\nSkill baru: \`${P}skilljob\` → ${JOB_SKILL[id].icon} ${JOB_SKILL[id].nama}`)
  }, 'mage'),

  rpg7('skilljob', ['pakaiskilljob', 'jobskill', 'skillkhusus'], 'Pakai skill khusus kelasmu (cooldown 10 menit)', m => {
    const st = stat7(K(m))
    const r = st.r
    if (!r.job) return m.reply(`❌ Kamu belum punya kelas.\nPilih dulu: \`${P}jobinfo\``)
    const sk = JOB_SKILL[r.job]
    const cd = (r.jobSkillTerakhir || 0) + 600000 - Date.now()
    if (cd > 0) return m.reply(`⏳ Skill *${sk.nama}* masih cooldown ${Math.ceil(cd / 1000)} detik.`)
    r.jobSkillTerakhir = Date.now()
    let hasil = ''
    if (sk.efek === 'heal') {
      r.health = Math.min(st.maxHealth, r.health + sk.nilai)
      r.energy = Math.min(st.maxEnergy, r.energy + 40)
      hasil = `❤️ +${sk.nilai} HP · ⚡ +40 energi`
    } else if (sk.efek === 'panen') {
      r.buff.push({ id: 'tanganSubur', nama: sk.nama, icon: sk.icon, efek: { panen: 1 }, sampai: Date.now() + 1800000 })
      hasil = '🌾 Panen berikutnya 2× (30 menit)'
    } else if (sk.efek === 'dmg') {
      r.buff.push({ id: 'bolaApi', nama: sk.nama, icon: sk.icon, efek: { atk: 0.6 }, sampai: Date.now() + 120000 })
      hasil = `🔥 +${sk.nilai} damage siap dilepas (ATK +60% selama 2 menit)`
    } else {
      const efek = { [sk.efek === 'atk' ? 'atk' : sk.efek === 'crit' ? 'crit' : 'luck']: sk.nilai }
      r.buff.push({ id: r.job, nama: sk.nama, icon: sk.icon, efek, sampai: Date.now() + sk.durasi })
      hasil = `${sk.icon} ${sk.desc.replace(/\s*selama.*$/i, '')} selama ${Math.round(sk.durasi / 60000)} menit`
    }
    catat7(r, `skill job ${sk.nama}`)
    simpan()
    const s2 = stat7(K(m))
    return m.reply(`${sk.icon} *${sk.nama} DIAKTIFKAN!*\n\n${hasil}\n\n📊 ATK ${s2.atk} · 🛡️ ${s2.def} · 🎯 crit ${Math.round(s2.crit * 100)}% · 🍀 luck ${s2.luck.toFixed(2)}×\n\nCek buff: \`${P}buffku\` · Cooldown berikutnya: 10 menit`)
  }),

  rpg7('buffku', ['lihatbuff', 'efekaku', 'daftarbuff'], 'Lihat buff aktif & sisa waktunya', m => {
    const r = R7(m)
    const list = buffAktif(r)
    simpan()
    if (!list.length) return m.reply(`✨ Tidak ada buff aktif.\n\nDapatkan buff dari:\n▸ Masakan: \`${P}resepmasakan\` → \`${P}masak\` → \`${P}makanbuff <id>\`\n▸ Skill job: \`${P}skilljob\`\n▸ Alkimia: \`${P}alkimia\``)
    const teks = `✨ *BUFF AKTIF (${list.length})*\n\n${list.map(b => `${b.icon || '✨'} *${b.nama}*\n▸ ${Object.entries(b.efek || {}).filter(([k]) => k !== 'durasi').map(([k, v]) => `${k} ${v > 0 && v < 1 ? '+' + Math.round(v * 100) + '%' : '+' + v}`).join(' · ')}\n▸ Sisa ${Math.ceil((b.sampai - Date.now()) / 60000)} menit`).join('\n\n')}\n\nStatistik saat ini: ⚔️ ${stat7(K(m)).atk} · 🛡️ ${stat7(K(m)).def} · 🍀 ${stat7(K(m)).luck.toFixed(2)}×`
    return m.reply(teks)
  }),

  rpg7('jobkartu', ['kartujob', 'kartukelas'], 'Kartu gambar kelasmu (tema menyesuaikan)', async m => {
    const st = stat7(K(m))
    const r = st.r
    const temaBg = r.job === 'mage' ? 'wizard,magic,castle' : r.job === 'archer' ? 'archer,forest,bow' : r.job === 'assassin' ? 'ninja,shadow,night' : r.job === 'farmer' ? 'farmer,wheat,field' : r.job === 'healer' ? 'healer,temple,light' : 'knight,sword,armor'
    const buf = await kartu7(m, {
      judul: `${st.job ? st.job.icon : '🎭'} ${st.job ? st.job.nama : 'PETUALANG'}`,
      sub: `Lv.${r.level} · ❤️ ${r.health}/${st.maxHealth} · ⚔️ ${st.atk} · 🛡️ ${st.def} · 🎯 ${Math.round(st.crit * 100)}% · 🍀 ${st.luck.toFixed(2)}×`,
      footer: `${m.pushName || 'Petualang'} · ${config.bot.name} RPG v7`,
      tema: r.job === 'assassin' ? 'midnight' : r.job === 'farmer' ? 'forest' : 'sunset',
      kataBg: temaBg, tinggi: 460
    })
    const teks = `🎭 *KARTU KELAS*\n\n${judulJob(st)}\n${st.job ? st.job.desc : `Belum ada kelas → ${P}jobinfo`}\n\n⚔️ ATK ${st.atk} · 🛡️ DEF ${st.def} · ❤️ ${r.health}/${st.maxHealth}\n🎯 Crit ${Math.round(st.crit * 100)}% · 🍀 Luck ${st.luck.toFixed(2)}× · 💰 Koin ${st.koin.toFixed(2)}×\n⚡ Energi ${r.energy}/${st.maxEnergy} (biaya ${Math.round(st.energi * 100)}%)\n🌳 Poin skill: ${r.skill.poin} · 🏆 Rebirth: ${r.rebirth.jumlah}×`
    return kirimKartu7(m, buf, teks, { title: '🎭 Kartu Job', buttons: [{ text: '🎯 Skill Job', id: `${P}skilljob` }, { text: '🌳 Skill Tree', id: `${P}skill` }, { text: '⚔️ Battle RPG', id: `${P}airichbattle` }] })
  }),

  rpg7('joblb', ['leaderboardjob', 'topjob', 'rankjob'], 'Peringkat pemain per kelas', m => {
    const us = allUsers().filter(u => u.rpg?.job)
    if (!us.length) return m.reply(`Belum ada yang memilih kelas.\nMulai: \`${P}jobinfo\``)
    const per = {}
    for (const u of us) { per[u.rpg.job] = per[u.rpg.job] || []; per[u.rpg.job].push(u) }
    const teks = Object.entries(per).map(([id, list]) => {
      const top = list.sort((a, b) => (b.rpg.level || 1) - (a.rpg.level || 1)).slice(0, 3)
      return `*${JOBS[id]?.icon || '❓'} ${JOBS[id]?.nama || id}* (${list.length} pemain)\n${top.map((u, i) => `${['🥇', '🥈', '🥉'][i]} ${u.name || u.jid.split('@')[0].slice(-6)} · Lv.${u.rpg.level || 1}`).join('\n')}`
    }).join('\n\n')
    return m.reply(`🏆 *PERINGKAT KELAS*\n\n${teks}\n\nTotal pemain berkelas: ${us.length}`)
  })
]

/* ================================================================== */
/*  B. SKILL TREE (6)                                                  */
/* ================================================================== */
const cabangSkill = () => {
  const out = {}
  for (const [id, s] of Object.entries(SKILLS)) (out[s.cabang] = out[s.cabang] || []).push([id, s])
  return out
}
const poinTersedia = r => {
  const dipakai = Object.keys(r.skill?.dimiliki || {}).reduce((a, id) => a + (SKILLS[id]?.biaya || 0), 0)
  const total = Math.max(0, (r.level || 1) - 2) + (r.rebirth?.jumlah || 0) * 3
  return { total, dipakai, sisa: Math.max(0, total - dipakai) }
}

export const skillCmds = [
  rpg7('skill', ['skilltree', 'pohonskill', 'skillku'], 'Lihat pohon skill (12 skill, 3 cabang) & poin', m => {
    const st = stat7(K(m))
    const r = st.r
    r.skill.poin = poinTersedia(r).sisa
    simpan()
    const dimiliki = r.skill.dimiliki || {}
    const teks = Object.entries(cabangSkill()).map(([cabang, list]) =>
      `*🌿 Cabang ${cabang}*\n${list.map(([id, s]) => {
        const punya = !!dimiliki[id]
        const siap = !s.butuh || dimiliki[s.butuh]
        return `${punya ? '✅' : siap ? '🔓' : '🔒'} ${s.icon} *${s.nama}* (${s.biaya} poin) — ${s.desc}${punya ? '' : !siap ? ` _butuh ${SKILLS[s.butuh].nama}_` : ''}\n   \`${P}belajarskill ${id}\``
      }).join('\n')}`).join('\n\n')
    return m.reply(`🌳 *POHON SKILL*\n\nPoin tersedia: *${poinTersedia(r).sisa}* (dari Lv.${r.level}${r.rebirth.jumlah ? ` + rebirth ${r.rebirth.jumlah}×3` : ''})\nTerpakai: ${poinTersedia(r).dipakai} · Total didapat: ${poinTersedia(r).total}\n\n${teks}\n\n+1 poin tiap level di atas 2 · Reset: \`${P}resetskill\``)
  }),

  rpg7('belajarskill', ['ambilskill', 'upgradeskill', 'pelajariskill'], 'Pelajari satu skill pakai poin', m => {
    const r = R7(m)
    const id = cariId(SKILLS, m.args?.[0])
    if (!id || !SKILLS[id]) return m.reply(`Contoh: \`${P}belajarskill serang1\`\nDaftar: \`${P}skill\``)
    const sk = SKILLS[id]
    if (r.skill.dimiliki[id]) return m.reply(`Kamu sudah punya ${sk.icon} *${sk.nama}*.`)
    if (sk.butuh && !r.skill.dimiliki[sk.butuh]) return m.reply(`🔒 Butuh skill *${SKILLS[sk.butuh].nama}* dulu.\n\n\`${P}belajarskill ${sk.butuh}\``)
    const { sisa } = poinTersedia(r)
    if (sisa < sk.biaya) return m.reply(`❌ Poin kurang: butuh ${sk.biaya}, punya ${sisa}.\n\nNaikkan level untuk dapat poin (\`${P}rpg\`), atau reset: \`${P}resetskill\``)
    r.skill.dimiliki[id] = Date.now()
    r.skill.poin = poinTersedia(r).sisa
    catat7(r, `belajar skill ${sk.nama}`)
    simpan()
    const s2 = stat7(K(m))
    return m.reply(`🌟 *SKILL DIPELAJARI: ${sk.icon} ${sk.nama}*\n\n${sk.desc}\nCabang: ${sk.cabang} · Biaya ${sk.biaya} poin\nSisa poin: *${poinTersedia(r).sisa}*\n\n📊 Statistik sekarang: ⚔️ ${s2.atk} · 🛡️ ${s2.def} · ❤️ maks ${s2.maxHealth} · 🎯 ${Math.round(s2.crit * 100)}% · 🍀 ${s2.luck.toFixed(2)}×\n\nSkill berikutnya: \`${P}skill\``)
  }, 'serang1'),

  rpg7('skillinfo', ['infoskill', 'rincianskill'], 'Rincian satu skill', m => {
    const id = cariId(SKILLS, m.args?.[0])
    if (!id || !SKILLS[id]) {
      return m.reply(`Contoh: \`${P}skillinfo serang3\`\n\nSemua skill:\n${Object.entries(SKILLS).map(([k, s]) => `▸ \`${k}\` ${s.icon} ${s.nama} (${s.biaya}p) — ${s.desc}`).join('\n')}`)
    }
    const s = SKILLS[id]
    const punya = !!R7(m).skill.dimiliki[id]
    return m.reply(`${s.icon} *${s.nama}*\n\n▸ Cabang: ${s.cabang}\n▸ Biaya: ${s.biaya} poin\n▸ Efek: ${s.desc}\n▸ Prasyarat: ${s.butuh ? SKILLS[s.butuh].nama : '-'}\n▸ Status: ${punya ? '✅ sudah dipelajari' : '🔓 tersedia'}\n\n${punya ? '' : `Pelajari: \`${P}belajarskill ${id}\``}`)
  }, 'serang1'),

  rpg7('resetskill', ['hapusskill', 'refundskill', 'respec'], 'Reset semua skill (poin kembali, biaya 3.000 koin)', m => {
    const r = R7(m)
    const jumlah = Object.keys(r.skill.dimiliki || {}).length
    if (!jumlah) return m.reply('Kamu belum punya skill apa pun.')
    if (!/ya|yakin/i.test(m.q || '')) {
      return m.reply(`⚠️ Reset *${jumlah} skill*?\n\nSemua poin (${poinTersedia(r).dipakai}) kembali, tapi bayar 3.000 koin.\n\nKonfirmasi: \`${P}resetskill ya\``)
    }
    if ((r.money || 0) < 3000) return m.reply(`❌ Butuh 3.000 koin. Punya ${fmt(r.money)}.`)
    r.money -= 3000
    r.skill.dimiliki = {}
    r.skill.poin = poinTersedia(r).sisa
    catat7(r, `reset ${jumlah} skill`)
    simpan()
    return m.reply(`🔄 *${jumlah} skill direset.* Poin kembali: ${r.skill.poin}\n-3.000 koin · sisa ${fmt(r.money)}\n\nAtur ulang: \`${P}skill\``)
  }, 'ya'),

  rpg7('poinskill', ['cekpoin', 'poinskillku'], 'Cek poin skill & cara menambahnya', m => {
    const r = R7(m)
    const p = poinTersedia(r)
    return m.reply(`🌟 *POIN SKILL*\n\nTersedia: *${p.sisa}*\nTerpakai: ${p.dipakai}\nTotal dari level: ${p.total} (Lv.${r.level} − 2${r.rebirth.jumlah ? ` + rebirth ${r.rebirth.jumlah}×3` : ''})\n\n*Cara menambah poin:*\n▸ Naik level → \`${P}rpg\`, \`${P}jelajah\`, \`${P}masukdungeon\`\n▸ Rebirth (prestige) → +3 poin permanen: \`${P}rebirthinfo\`\n\nBelanja skill: \`${P}skill\``)
  }),

  rpg7('skillkartu', ['kartuskill', 'kartupohon'], 'Kartu gambar pohon skill & poin', async m => {
    const st = stat7(K(m))
    const r = st.r
    const p = poinTersedia(r)
    const dimiliki = Object.keys(r.skill.dimiliki || {})
    const buf = await kartu7(m, {
      judul: '🌳 POHON SKILL',
      sub: `${dimiliki.length}/12 skill · ${p.sisa} poin · ${st.job ? st.job.icon + ' ' + st.job.nama : '🎭 tanpa kelas'}`,
      footer: `${m.pushName || 'Petualang'} · RPG v7`,
      tema: 'forest', kataBg: 'skill,tree,magic', tinggi: 420
    })
    const teks = `🌳 *KARTU SKILL*\n\nSkill dipelajari: *${dimiliki.length}/12* · poin sisa *${p.sisa}*\n${dimiliki.length ? dimiliki.map(id => `▸ ${SKILLS[id].icon} ${SKILLS[id].nama}`).join('\n') : '_belum ada skill_'}\n\n📊 Efek total: ⚔️ +${Math.round(st.s.atkPct * 100)}% ATK · 🛡️ +${Math.round(st.s.defPct * 100)}% DEF · ❤️ +${st.s.hpFlat} HP · 🎯 ${Math.round(st.crit * 100)}% crit · 🍀 ${st.luck.toFixed(2)}× luck`
    return kirimKartu7(m, buf, teks, { title: '🌳 Skill', buttons: [{ text: '🌳 Buka Pohon Skill', id: `${P}skill` }, { text: '🌟 Poin Skill', id: `${P}poinskill` }] })
  })
]

/* ================================================================== */
/*  C. GUILD (10)                                                      */
/* ================================================================== */
const MISI_GUILD = () => ({ minggu: MINGGU(), donasi: 0, targetDonasi: 20000, rekrut: 0, targetRekrut: 2, boss: 0, targetBoss: 15, klaim: [] })

export const guildCmds = [
  rpg7('buatguild', ['createguild', 'binguild', 'dirikanguild'], 'Dirikan guild (25.000 koin, Lv.5+) — kartu HTML animasi', async m => {
    const r = R7(m)
    const nama = (m.q || m.args?.join(' ') || '').trim().slice(0, 24)
    if (!nama) return m.reply(`Contoh: \`${P}buatguild Naga Merah\``)
    if (r.guild?.id) return m.reply(`Kamu sudah ada di guild *${guildDariId(r.guild.id)?.nama || '?'}*.\nKeluar dulu: \`${P}guildkeluar\``)
    if (r.level < 5) return m.reply(`❌ Butuh Lv.5 untuk mendirikan guild. Level kamu: ${r.level}.`)
    if ((r.money || 0) < 25000) return m.reply(`❌ Biaya 25.000 koin. Punya: ${fmt(r.money)}.`)
    if (cariGuild(nama)) return m.reply(`❌ Nama guild "${nama}" sudah dipakai.`)
    r.money -= 25000
    const id = 'g' + Date.now().toString(36)
    const db = guildDB()
    db[id] = {
      id, nama, pemimpin: K(m), dibuat: Date.now(), bendahara: 0, deskripsi: '',
      misi: MISI_GUILD(), log: [{ w: Date.now(), t: `${m.pushName || 'seseorang'} mendirikan guild` }]
    }
    simpanGuild()
    r.guild = { id, donasi: 0, masuk: Date.now() }
    catat7(r, `mendirikan guild ${nama}`)
    simpan()
    /* v7.31.0: kartu HTML animasi perayaan guild */
    try { await kirimKartu(m, `🏰 Guild ${nama}`, kartuGuildBaru(config.bot.name, { nama, pemimpin: m.pushName || 'Pemimpin', biaya: 25000 }), null) } catch {}
    return m.reply(`🏰 *GUILD DIDIRIKAN: ${nama}*\n\n-${fmt(25000)} koin · sisa ${fmt(r.money)}\nKamu jadi *Pemimpin*.\n\n📋 Misi mingguan guild sudah aktif → \`${P}guildmisi\`\nUndang teman: \`${P}joinguild ${nama}\`\nDonasi untuk naikkan level guild: \`${P}guilddonasi 5000\``)
  }, 'Naga Merah'),

  rpg7('joinguild', ['masukkan guild'.replace(' ', ''), 'gabungguild', 'enterguild'], 'Gabung guild yang sudah ada', m => {
    const r = R7(m)
    const nama = (m.q || m.args?.join(' ') || '').trim()
    if (!nama) {
      const list = Object.values(guildDB())
      return m.reply(list.length
        ? `Sebutkan nama guild.\n\nGuild tersedia:\n${list.map(g => `▸ *${g.nama}* (Lv.${levelGuild(g)} · ${anggotaGuild(g.id).length} anggota)`).join('\n')}\n\nContoh: \`${P}joinguild ${list[0].nama}\``
        : `Belum ada guild. Dirikan: \`${P}buatguild Naga Merah\``)
    }
    if (r.guild?.id) return m.reply(`Kamu sudah di guild *${guildDariId(r.guild.id)?.nama}*.\nKeluar: \`${P}guildkeluar\``)
    const g = cariGuild(nama)
    if (!g) return m.reply(`❌ Guild "${nama}" tidak ditemukan.\nLihat daftar: \`${P}joinguild\``)
    if (anggotaGuild(g.id).length >= 20) return m.reply(`❌ Guild *${g.nama}* sudah penuh (20 anggota).`)
    r.guild = { id: g.id, donasi: 0, masuk: Date.now() }
    g.misi = g.misi?.minggu === MINGGU() ? g.misi : MISI_GUILD()
    g.misi.rekrut = (g.misi.rekrut || 0) + 1
    g.log = [{ w: Date.now(), t: `${m.pushName || 'anggota baru'} bergabung` }, ...(g.log || [])].slice(0, 15)
    simpanGuild(); catat7(r, `gabung guild ${g.nama}`); simpan()
    return m.reply(`🤝 *SELAMAT DATANG DI ${g.nama}* ${g.nama}\n\nAnggota: ${anggotaGuild(g.id).length}/20 · Level guild: ${levelGuild(g)}\nBendahara: ${fmt(g.bendahara)} koin\n\n📋 Misi mingguan: \`${P}guildmisi\`\n💰 Donasi: \`${P}guilddonasi 1000\``)
  }, 'Naga Merah'),

  rpg7('guildku', ['guildsaya', 'infoguildku', 'guild'], 'Info guild tempat kamu bernaung', async m => {
    const r = R7(m)
    if (!r.guild?.id) return m.reply(`Kamu belum punya guild.\n\nGabung: \`${P}joinguild\`\nDirikan: \`${P}buatguild Naga Merah\` (25.000 koin, Lv.5+)`)
    const g = guildDariId(r.guild.id)
    if (!g) { r.guild = { id: null, donasi: 0 }; simpan(); return m.reply('⚠️ Guild kamu sudah bubar.') }
    const ang = anggotaGuild(g.id)
    const lv = levelGuild(g)
    const mis = g.misi?.minggu === MINGGU() ? g.misi : (g.misi = MISI_GUILD(), simpanGuild(), g.misi)
    const teks = `🏰 *GUILD ${g.nama.toUpperCase()}*\n\nLevel: *${lv}* · Anggota: ${ang.length}/20 · Bendahara: ${fmt(g.bendahara)} koin\nPemimpin: ${getUser(g.pemimpin)?.name || g.pemimpin.split('@')[0].slice(-6)}\nDidirikan: ${new Date(g.dibuat).toLocaleDateString('id-ID')}\n\n📋 *Misi mingguan* (reset tiap Senin UTC)\n▸ 💰 Donasi ${fmt(mis.donasi)}/${fmt(mis.targetDonasi)} ${bar7(mis.donasi, mis.targetDonasi)}\n▸ 👥 Rekrut ${mis.rekrut}/${mis.targetRekrut} ${bar7(mis.rekrut, mis.targetRekrut)}\n▸ 👹 Damage boss ${fmt(mis.boss)}/${fmt(mis.targetBoss)} ${bar7(mis.boss, mis.targetBoss)}\nHadiah: 15.000 koin + 800 EXP tiap anggota → \`${P}guildklaim\`\n\nDonasiku: ${fmt(r.guild.donasi || 0)} koin\nLog terakhir:\n${(g.log || []).slice(0, 3).map(l => `▸ ${l.t}`).join('\n') || '-'}`
    const buf = await kartu7(m, { judul: `🏰 ${g.nama}`, sub: `Level ${lv} · ${ang.length} anggota · ${fmt(g.bendahara)} koin`, footer: `${config.bot.name} · Guild RPG v7`, tema: 'royal', kataBg: 'castle,guild,medieval', tinggi: 420 })
    return kirimKartu7(m, buf, teks, { title: '🏰 Guild', buttons: [{ text: '👥 Anggota', id: `${P}guildanggota` }, { text: '📋 Misi Guild', id: `${P}guildmisi` }, { text: '💰 Donasi 1000', id: `${P}guilddonasi 1000` }] })
  }),

  rpg7('guildinfo', ['cekguild', 'guildcari', 'cariguild'], 'Cari info guild berdasarkan nama', m => {
    const nama = m.q || ''
    const db = guildDB()
    const list = Object.values(db).filter(g => !nama || (g.nama || '').toLowerCase().includes(nama.toLowerCase()))
    if (!list.length) return m.reply(nama ? `❌ Tidak ada guild bernama "${nama}".` : `Belum ada guild sama sekali.\nDirikan: \`${P}buatguild Naga Merah\``)
    return m.reply(`🏰 *DAFTAR GUILD (${list.length})*\n\n${list.map(g => `*${g.nama}* (Lv.${levelGuild(g)})\n▸ ${anggotaGuild(g.id).length}/20 anggota · bendahara ${fmt(g.bendahara)}\n▸ Pemimpin: ${getUser(g.pemimpin)?.name || '-'}\n▸ Gabung: \`${P}joinguild ${g.nama}\``).join('\n\n')}`)
  }),

  rpg7('guildanggota', ['listanggota', 'memberguild', 'anggotaguild'], 'Daftar anggota guild + kontribusi', m => {
    const r = R7(m)
    const g = guildDariId(r.guild?.id)
    if (!g) return m.reply(`Kamu belum punya guild.\nGabung: \`${P}joinguild\``)
    const ang = anggotaGuild(g.id).sort((a, b) => (b.rpg.guild?.donasi || 0) - (a.rpg.guild?.donasi || 0))
    return m.reply(`👥 *ANGGOTA ${g.nama}* (${ang.length}/20)\n\n${ang.map((u, i) => `${i + 1}. ${u.rpg.guild?.id === g.pemimpin ? '👑 ' : ''}${u.name || u.jid.split('@')[0].slice(-6)} · Lv.${u.rpg.level || 1}\n   💰 donasi ${fmt(u.rpg.guild?.donasi || 0)} · ⚔️ ATK ${stat7(u.jid).atk}`).join('\n')}\n\nDonasi: \`${P}guilddonasi 1000\``)
  }),

  rpg7('guilddonasi', ['donasiguild', 'sumbangguild', 'donateguild'], 'Donasi koin ke bendahara guild', m => {
    const r = R7(m)
    const g = guildDariId(r.guild?.id)
    if (!g) return m.reply(`Kamu belum punya guild.\nGabung: \`${P}joinguild\``)
    const jumlah = parseInt(String(m.args?.[0] || '').replace(/\D/g, ''), 10)
    if (!jumlah || jumlah < 100) return m.reply(`Contoh: \`${P}guilddonasi 1000\` (minimal 100 koin)`)
    if ((r.money || 0) < jumlah) return m.reply(`❌ Koin kurang: punya ${fmt(r.money)}, butuh ${fmt(jumlah)}.`)
    const lvSebelum = levelGuild(g)
    r.money -= jumlah
    r.guild.donasi = (r.guild.donasi || 0) + jumlah
    g.bendahara = (g.bendahara || 0) + jumlah
    g.misi = g.misi?.minggu === MINGGU() ? g.misi : MISI_GUILD()
    g.misi.donasi = (g.misi.donasi || 0) + jumlah
    g.log = [{ w: Date.now(), t: `${m.pushName || 'anggota'} donasi ${fmt(jumlah)}` }, ...(g.log || [])].slice(0, 15)
    simpanGuild(); catat7(r, `donasi guild ${fmt(jumlah)}`); simpan()
    const lv = levelGuild(g)
    return m.reply(`💰 *DONASI BERHASIL*\n\n+${fmt(jumlah)} koin ke bendahara *${g.nama}*\nTotal donasimu: ${fmt(r.guild.donasi)}\nBendahara: ${fmt(g.bendahara)} · Level guild: *${lv}*\n${lv > lvSebelum ? `\n🎉 *GUILD NAIK LEVEL ${lvSebelum} → ${lv}!* Bonus regen & hadiah misi meningkat.` : `\nLevel berikutnya di ${(lv * 20000).toLocaleString('id-ID')} koin ${bar7(g.bendahara, lv * 20000)}`}\n\nMisi: \`${P}guildmisi\``)
  }, '1000'),

  rpg7('guildmisi', ['misiguild', 'tugasguild', 'questguild'], 'Progres misi mingguan guild', m => {
    const r = R7(m)
    const g = guildDariId(r.guild?.id)
    if (!g) return m.reply(`Kamu belum punya guild.\nGabung: \`${P}joinguild\``)
    if (g.misi?.minggu !== MINGGU()) { g.misi = MISI_GUILD(); simpanGuild() }
    const mis = g.misi
    const selesai = mis.donasi >= mis.targetDonasi && mis.rekrut >= mis.targetRekrut && mis.boss >= mis.targetBoss
    const klaim = mis.klaim.includes(HARI())
    return m.reply(`📋 *MISI MINGGUAN GUILD ${g.nama}*\n\nMinggu: ${mis.minggu}\n\n▸ 💰 Donasi ${fmt(mis.donasi)}/${fmt(mis.targetDonasi)} ${bar7(mis.donasi, mis.targetDonasi)} ${mis.donasi >= mis.targetDonasi ? '✅' : ''}\n▸ 👥 Rekrut anggota ${mis.rekrut}/${mis.targetRekrut} ${bar7(mis.rekrut, mis.targetRekrut)} ${mis.rekrut >= mis.targetRekrut ? '✅' : ''}\n▸ 👹 Damage world boss ${fmt(mis.boss)}/${fmt(mis.targetBoss)} ${bar7(mis.boss, mis.targetBoss)} ${mis.boss >= mis.targetBoss ? '✅' : ''}\n\nStatus: ${selesai ? '🎉 *SELESAI*' : '⏳ belum lengkap'}\nHadiah: 15.000 koin + 800 EXP + 1 permata acak per anggota\n\n${selesai && !klaim ? `Klaim: \`${P}guildklaim\`` : klaim ? '✅ Sudah diklaim hari ini.' : `Cara bantu: \`${P}guilddonasi 1000\` · \`${P}serangboss\` · undang teman \`${P}joinguild ${g.nama}\``}`)
  }),

  rpg7('guildklaim', ['klaimmisiguild', 'hadiahguild', 'claimguild'], 'Klaim hadiah misi mingguan guild', m => {
    const r = R7(m)
    const g = guildDariId(r.guild?.id)
    if (!g) return m.reply(`Kamu belum punya guild.\nGabung: \`${P}joinguild\``)
    if (g.misi?.minggu !== MINGGU()) { g.misi = MISI_GUILD(); simpanGuild() }
    const mis = g.misi
    const selesai = mis.donasi >= mis.targetDonasi && mis.rekrut >= mis.targetRekrut && mis.boss >= mis.targetBoss
    if (!selesai) return m.reply(`❌ Misi mingguan belum selesai.\n\nLihat progres: \`${P}guildmisi\``)
    if (mis.klaim.includes(K(m))) return m.reply('✅ Kamu sudah klaim hadiah misi minggu ini.')
    mis.klaim.push(K(m))
    const koin = koinHadiah(stat7(K(m)), 15000)
    const exp = expHadiah(stat7(K(m)), 800)
    r.money = (r.money || 0) + koin
    addExp(K(m), exp)
    const gem = pickRandom(['rubin', 'safir', 'zamrud', 'topaz', 'ametis'])
    addItem(K(m), gem, 1)
    g.log = [{ w: Date.now(), t: `${m.pushName || 'anggota'} klaim hadiah misi` }, ...(g.log || [])].slice(0, 15)
    simpanGuild(); catat7(r, `klaim hadiah misi guild (+${fmt(koin)})`); simpan()
    return m.reply(`🎁 *HADIAH MISI GUILD*\n\n+${fmt(koin)} koin\n+${exp} EXP\n+1 ${GEMS_ICON[gem] || '💎'} ${gem} (masuk inventory)\n\nPermata bisa dipasang ke senjata/armor: \`${P}pasangpermata ${gem} weapon\``)
  }),

  rpg7('guildkeluar', ['leaveguild', 'keluarguild', 'quitguild'], 'Keluar dari guild', m => {
    const r = R7(m)
    const g = guildDariId(r.guild?.id)
    if (!g) return m.reply('Kamu tidak punya guild.')
    if (g.pemimpin === K(m) && anggotaGuild(g.id).length > 1) {
      return m.reply(`❌ Kamu pemimpin guild. Pindahkan dulu atau bubarkan:\n▸ Bubarkan: \`${P}guildbubar ya\`\n▸ Atau keluar setelah semua anggota pergi`)
    }
    const nama = g.nama
    if (g.pemimpin === K(m)) { delete guildDB()[g.id]; simpanGuild() }
    r.guild = { id: null, donasi: 0 }
    catat7(r, `keluar dari guild ${nama}`)
    simpan()
    return m.reply(`👋 Kamu keluar dari guild *${nama}*.\n\nGabung lagi: \`${P}joinguild\``)
  }),

  rpg7('guildbubar', ['hapussguild', 'dissolveguild', 'bubarkanguild'], 'Bubarkan guild (hanya pemimpin)', m => {
    const r = R7(m)
    const g = guildDariId(r.guild?.id)
    if (!g) return m.reply('Kamu tidak punya guild.')
    if (g.pemimpin !== K(m)) return m.reply('❌ Hanya pemimpin guild yang bisa membubarkan.')
    if (!/ya|yakin/i.test(m.q || '')) return m.reply(`⚠️ Bubarkan guild *${g.nama}* (${anggotaGuild(g.id).length} anggota, bendahara ${fmt(g.bendahara)} koin hangus)?\n\nKonfirmasi: \`${P}guildbubar ya\``)
    for (const u of anggotaGuild(g.id)) { u.rpg.guild = { id: null, donasi: 0 } }
    delete guildDB()[g.id]
    simpanGuild(); simpan()
    return m.reply(`💥 Guild *${g.nama}* dibubarkan. Semua anggota dibebaskan.`)
  }, 'ya'),

  rpg7('guildlb', ['leaderboardguild', 'rankguild'], 'Peringkat guild (level, anggota, bendahara)', m => {
    const list = Object.values(guildDB())
    if (!list.length) return m.reply(`Belum ada guild.\nDirikan: \`${P}buatguild Naga Merah\``)
    const urut = list.sort((a, b) => (levelGuild(b) - levelGuild(a)) || (b.bendahara - a.bendahara))
    return m.reply(`🏆 *PERINGKAT GUILD*\n\n${urut.map((g, i) => `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} *${g.nama}* — Lv.${levelGuild(g)}\n   👥 ${anggotaGuild(g.id).length} anggota · 💰 ${fmt(g.bendahara)} · 📋 misi ${g.misi?.minggu === MINGGU() ? Math.round(((g.misi.donasi >= g.misi.targetDonasi) + (g.misi.rekrut >= g.misi.targetRekrut) + (g.misi.boss >= g.misi.targetBoss)) / 3 * 100) + '%' : '0%'}`).join('\n\n')}`)
  }),

  rpg7('guildkartu', ['kartuguild', 'kartuklan'], 'Kartu gambar guild (tema kastil)', async m => {
    const r = R7(m)
    const g = guildDariId(r.guild?.id)
    if (!g) return m.reply(`Kamu belum punya guild.\nGabung: \`${P}joinguild\` · Buat: \`${P}buatguild Naga Merah\``)
    const ang = anggotaGuild(g.id)
    const buf = await kartu7(m, { judul: `🏰 ${g.nama}`, sub: `Level ${levelGuild(g)} · ${ang.length}/20 anggota · ${fmt(g.bendahara)} koin`, footer: `${config.bot.name} · Guild RPG v7`, tema: 'royal', kataBg: 'castle,medieval,banner', tinggi: 440 })
    return kirimKartu7(m, buf, `🏰 *KARTU GUILD ${g.nama}*\n\nLevel ${levelGuild(g)} · ${ang.length} anggota\nBendahara ${fmt(g.bendahara)} koin\nPemimpin: ${getUser(g.pemimpin)?.name || '-'}\n\nTop donatur:\n${ang.sort((a, b) => (b.rpg.guild?.donasi || 0) - (a.rpg.guild?.donasi || 0)).slice(0, 3).map((u, i) => `${['🥇', '🥈', '🥉'][i]} ${u.name || u.jid.split('@')[0].slice(-6)} — ${fmt(u.rpg.guild?.donasi || 0)}`).join('\n')}`, { title: '🏰 Guild', buttons: [{ text: '👥 Anggota', id: `${P}guildanggota` }, { text: '📋 Misi', id: `${P}guildmisi` }] })
  })
]
const GEMS_ICON = { rubin: '🔴', safir: '🔵', zamrud: '🟢', topaz: '🟡', ametis: '🟣', berlianhitam: '⚫' }

/* ================================================================== */
/*  D. WORLD BOSS (7)                                                  */
/* ================================================================== */
export const bossCmds = [
  rpg7('worldboss', ['bosdunia', 'bossdunia', 'wboss'], 'Status world boss (HP bersama semua pemain)', async m => {
    const db = bossDB()
    const b = db.aktif
    const info = infoBoss()
    const kontrib = Object.entries(b.kontribusi || {}).sort((a, x) => x[1] - a[1])
    const st = stat7(K(m))
    const teks = `${info.icon} *WORLD BOSS: ${info.nama.toUpperCase()}*\n\n❤️ HP: ${fmt(b.hp)}/${fmt(b.hpMax)}\n${bar7(b.hp, b.hpMax, 20)}\n\n⚔️ ATK boss: ${info.atk} · 🎁 Hadiah: ${fmt(info.hadiah)} koin + ${fmt(info.exp)} EXP + ${info.item}\n📊 Syarat: Lv.${info.level}+ · energi 30/serangan\n\n👥 Penyerang: ${kontrib.length} pemain\n${kontrib.slice(0, 5).map(([jid, d], i) => `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} ${getUser(jid)?.name || jid.split('@')[0].slice(-6)} — ${fmt(d)} damage`).join('\n') || '_belum ada yang menyerang_'}\n\nKontribusimu: *${fmt(b.kontribusi?.[K(m)] || 0)}*\nStatistikmu: ⚔️ ${st.atk} · 🎯 crit ${Math.round(st.crit * 100)}% · 🐉 bonus boss +${Math.round(st.dmgBoss * 100)}%\n\nSerang: \`${P}serangboss\` · Peringkat: \`${P}bossrank\``
    const buf = await kartu7(m, { judul: `${info.icon} ${info.nama}`, sub: `HP ${fmt(b.hp)}/${fmt(b.hpMax)} · ${kontrib.length} penyerang`, footer: `${config.bot.name} · World Boss RPG v7`, tema: 'midnight', kataBg: 'dragon,monster,dark', tinggi: 440 })
    return kirimKartu7(m, buf, teks, { title: `${info.icon} World Boss`, buttons: [{ text: '⚔️ Serang Boss', id: `${P}serangboss` }, { text: '🏆 Peringkat', id: `${P}bossrank` }, { text: '🎁 Hadiah', id: `${P}bosshadiah` }] })
  }),

  rpg7('serangboss', ['attackboss', 'hitboss', 'pukulboss'], 'Serang world boss (30 energi, cooldown 2 menit)', m => {
    const st = stat7(K(m))
    const r = st.r
    if (r.level < infoBoss().level) return m.reply(`❌ Butuh Lv.${infoBoss().level} untuk melawan ${infoBoss().nama}. Level kamu ${r.level}.`)
    const cd = (r.bossTerakhir || 0) + 120000 - Date.now()
    if (cd > 0) return m.reply(`⏳ Tunggu ${Math.ceil(cd / 1000)} detik sebelum menyerang lagi.`)
    if (!butuhEnergi(m, st, 30, 'menyerang world boss')) return null
    const db = bossDB()
    const b = db.aktif
    const crit = Math.random() < st.crit
    let dmg = Math.max(10, Math.round(st.atk * (1.6 + Math.random() * 0.8) * (1 + st.dmgBoss) * (crit ? 2 : 1)))
    b.hp = Math.max(0, b.hp - dmg)
    b.kontribusi = b.kontribusi || {}
    b.kontribusi[K(m)] = (b.kontribusi[K(m)] || 0) + dmg
    r.bossTerakhir = Date.now()
    r.boss = r.boss || { kontribusi: 0, klaim: '' }
    // progres misi guild
    const g = guildDariId(r.guild?.id)
    if (g) { g.misi = g.misi?.minggu === MINGGU() ? g.misi : MISI_GUILD(); g.misi.boss = (g.misi.boss || 0) + dmg; simpanGuild() }
    // boss membalas
    const balas = Math.max(3, Math.round(infoBoss().atk * (0.4 + Math.random() * 0.3) - st.def * 0.35))
    r.health = Math.max(1, r.health - balas)
    catat7(r, `serang world boss -${dmg} HP boss`)
    let teks = `${crit ? '💥 *CRITICAL!* ' : ''}⚔️ Kamu memberi *${fmt(dmg)}* damage ke ${infoBoss().icon} ${infoBoss().nama}.\n\n❤️ Boss: ${fmt(b.hp)}/${fmt(b.hpMax)} ${bar7(b.hp, b.hpMax, 16)}\n💢 Boss membalas: -${balas} HP (sisa ${r.health}/${st.maxHealth})\n📊 Kontribusimu: ${fmt(b.kontribusi[K(m)])}\n⏳ Serangan berikutnya: 2 menit`
    if (b.hp <= 0) {
      b.selesai = true
      b.oleh = m.pushName || 'petualang'
      b.selesaiPada = Date.now()
      db.riwayat = [{ id: b.id, oleh: b.oleh, pada: Date.now(), penyerang: Object.keys(b.kontribusi).length }, ...(db.riwayat || [])].slice(0, 10)
      teks += `\n\n🎉 *BOSS TUMBANG!* Semua penyerang bisa klaim hadiah: \`${P}bosshadiah\`\nBoss baru akan muncul setelah hadiah dibagikan.`
    }
    simpan(); saveDB('worldboss')
    return m.reply(teks)
  }),

  rpg7('bossrank', ['rankboss', 'peringatan boss'.replace(' ', ''), 'kontribusiboss'], 'Peringkat kontribusi world boss', m => {
    const b = bossDB().aktif
    const list = Object.entries(b.kontribusi || {}).sort((a, x) => x[1] - a[1]).slice(0, 10)
    if (!list.length) return m.reply(`Belum ada yang menyerang ${infoBoss().nama}.\nMulai: \`${P}serangboss\``)
    const total = Object.values(b.kontribusi).reduce((a, x) => a + x, 0)
    return m.reply(`🏆 *PERINGKAT WORLD BOSS* — ${infoBoss().icon} ${infoBoss().nama}\n\n❤️ Sisa HP: ${fmt(b.hp)}/${fmt(b.hpMax)}\n⚔️ Total damage semua pemain: ${fmt(total)}\n\n${list.map(([jid, d], i) => `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} ${getUser(jid)?.name || jid.split('@')[0].slice(-6)} — ${fmt(d)} (${Math.round(d / total * 100)}%)`).join('\n')}\n\nHadiah dibagi proporsional saat boss tumbang → \`${P}bosshadiah\``)
  }),

  rpg7('bosshadiah', ['klaimboss', 'rewardboss', 'hadiahboss'], 'Klaim hadiah world boss (setelah tumbang)', m => {
    const db = bossDB()
    const b = db.aktif
    const r = R7(m)
    if (!b.selesai) return m.reply(`❌ Boss belum tumbang (HP ${fmt(b.hp)}/${fmt(b.hpMax)}).\n\nSerang: \`${P}serangboss\``)
    const dmg = b.kontribusi?.[K(m)] || 0
    if (!dmg) return m.reply('❌ Kamu tidak ikut menyerang, jadi tidak dapat hadiah.')
    if (r.boss?.klaim === b.id + ':' + (b.selesaiPada || 0)) return m.reply('✅ Kamu sudah klaim hadiah boss ini.')
    const total = Object.values(b.kontribusi).reduce((a, x) => a + x, 0) || 1
    const info = infoBoss()
    const bagian = dmg / total
    const koin = Math.round(koinHadiah(stat7(K(m)), info.hadiah * (0.25 + bagian * 0.75)))
    const exp = Math.round(expHadiah(stat7(K(m)), info.exp * (0.25 + bagian * 0.75)))
    r.money = (r.money || 0) + koin
    addExp(K(m), exp)
    const dapatItem = bagian > 0.2 || Math.random() < 0.5
    if (dapatItem) addItem(K(m), info.item, 1)
    r.boss = { kontribusi: dmg, klaim: b.id + ':' + (b.selesaiPada || 0) }
    r.prestasi = r.prestasi || { klaim: [], gelar: '' }
    catat7(r, `klaim hadiah world boss +${fmt(koin)}`)
    // spawn boss baru kalau semua penyerang utama sudah klaim
    const belum = Object.keys(b.kontribusi).filter(jid => (R7jid(jid).boss?.klaim || '') !== b.id + ':' + (b.selesaiPada || 0))
    if (!belum.length) {
      db.aktif = null
      saveDB('worldboss')
      bossDB()
    }
    simpan()
    return m.reply(`🎁 *HADIAH WORLD BOSS*\n\n${info.icon} ${info.nama} dikalahkan!\nKontribusimu: ${fmt(dmg)} (${(bagian * 100).toFixed(1)}% dari ${fmt(total)})\n\n+${fmt(koin)} koin\n+${fmt(exp)} EXP\n${dapatItem ? `+1 ${ITEMS[info.item]?.icon || '🎁'} ${ITEMS[info.item]?.name || info.item}` : '(tidak dapat item — butuh kontribusi >20%)'}\n\n${!belum.length ? '🆕 World boss baru sudah muncul! ' + P + 'worldboss' : `Masih ${belum.length} penyerang belum klaim.`}`)
  }),

  rpg7('bossinfo', ['listboss', 'daftarbos', 'infoboss'], 'Daftar semua world boss & syaratnya', m => {
    const aktif = infoBoss()
    return m.reply(`👹 *DAFTAR WORLD BOSS*\n\nBoss aktif: ${aktif.icon} *${aktif.nama}* (Lv.${aktif.level}+)\n\n${BOSSES.map(b => `${b.icon} *${b.nama}*${b.id === aktif.id ? '  ← AKTIF' : ''}\n▸ HP ${fmt(b.hp)} · ATK ${b.atk} · syarat Lv.${b.level}\n▸ Hadiah ${fmt(b.hadiah)} koin + ${fmt(b.exp)} EXP + ${ITEMS[b.item]?.icon || ''} ${ITEMS[b.item]?.name || b.item}`).join('\n\n')}\n\nBoss berikutnya muncul otomatis setelah semua penyerang klaim hadiah.\nCek rata-rata level server menentukan boss yang muncul.`)
  }),

  rpg7('bosskartu', ['kartuboss', 'kartuworldboss'], 'Kartu gambar world boss', async m => {
    const b = bossDB().aktif
    const info = infoBoss()
    const buf = await kartu7(m, { judul: `${info.icon} ${info.nama}`, sub: `HP ${fmt(b.hp)}/${fmt(b.hpMax)} · ${Object.keys(b.kontribusi || {}).length} penyerang · Lv.${info.level}+`, footer: `${config.bot.name} · World Boss`, tema: 'midnight', kataBg: `${info.id === 'kraken' ? 'kraken,ocean,storm' : info.id === 'lichKing' ? 'skull,undead,dark' : info.id === 'nagaEs' ? 'ice,dragon,snow' : 'goblin,cave,monster'}`, tinggi: 460 })
    return kirimKartu7(m, buf, `${info.icon} *${info.nama}*\n\n❤️ ${fmt(b.hp)}/${fmt(b.hpMax)} ${bar7(b.hp, b.hpMax, 18)}\n⚔️ ATK ${info.atk} · 🎁 ${fmt(info.hadiah)} koin\n\nKontribusimu: ${fmt(b.kontribusi?.[K(m)] || 0)}\nSerang: \`${P}serangboss\``, { title: `${info.icon} Boss`, buttons: [{ text: '⚔️ Serang', id: `${P}serangboss` }, { text: '🏆 Peringkat', id: `${P}bossrank` }] })
  }),

  rpg7('bosshiwayat', ['riwayatboss', 'historyboss', 'bosskalah'], 'Riwayat world boss yang sudah dikalahkan', m => {
    const db = bossDB()
    const list = db.riwayat || []
    if (!list.length) return m.reply('Belum ada world boss yang dikalahkan.\nJadilah yang pertama: ' + P + 'serangboss')
    return m.reply(`📜 *RIWAYAT WORLD BOSS*\n\n${list.map(r => `▸ ${BOSSES.find(b => b.id === r.id)?.icon || '👹'} ${BOSSES.find(b => b.id === r.id)?.nama || r.id} — dikalahkan ${r.oleh}\n   ${new Date(r.pada).toLocaleString('id-ID')} · ${r.penyerang} penyerang`).join('\n')}\n\nBoss sekarang: ${infoBoss().icon} ${infoBoss().nama} (HP ${fmt(db.aktif.hp)})`)
  })
]

/* ================================================================== */
/*  E. MENU v7 (1)                                                     */
/* ================================================================== */
export const menuV7 = [
  rpg7('rpgmenu4', ['rpgv7', 'menurpgv7', 'rpglanjutan', 'rpg4'], 'Menu RPG v7: job, skill, guild, world boss', m => {
    const st = stat7(K(m))
    const r = st.r
    const g = guildDariId(r.guild?.id)
    const b = bossDB().aktif
    return m.sendList({
      title: `⚔️ RPG v7 — Lv.${r.level}`,
      text: `🎭 Job: ${st.job ? st.job.icon + ' ' + st.job.nama : 'belum pilih'} · 🌳 Skill ${Object.keys(r.skill.dimiliki || {}).length}/12 (${poinTersedia(r).sisa} poin)\n🏰 Guild: ${g ? g.nama + ' (Lv.' + levelGuild(g) + ')' : 'tidak ada'} · 👹 Boss: ${infoBoss().icon} ${fmt(b.hp)}/${fmt(b.hpMax)} HP\n💰 ${fmt(r.money)} koin · ❤️ ${r.health}/${st.maxHealth} · ⚡ ${r.energy}/${st.maxEnergy}\n⚔️ ATK ${st.atk} · 🛡️ DEF ${st.def} · 🎯 crit ${Math.round(st.crit * 100)}% · 🍀 luck ${st.luck.toFixed(2)}×\n\nPilih sistem v7:`,
      footer: config.bot.footer,
      buttonText: '⚔️ RPG v7',
      sections: [
        {
          title: '🎭 Job & Skill',
          rows: [
            { title: '🎭 Kelas / Job', description: st.job ? st.job.nama : 'pilih dari 6 kelas', id: `${P}jobinfo` },
            { title: '🃏 Kartu Job', description: 'kartu bergambar kelasmu', id: `${P}jobkartu` },
            { title: '🎯 Skill Khusus Job', description: st.job ? JOB_SKILL[st.job.id || r.job]?.desc || '' : '', id: `${P}skilljob` },
            { title: '🌳 Pohon Skill', description: `12 skill · ${poinTersedia(r).sisa} poin`, id: `${P}skill` },
            { title: '✨ Buff Aktif', description: `${buffAktif(r).length} buff`, id: `${P}buffku` }
          ]
        },
        {
          title: '🏰 Guild',
          rows: [
            { title: '🏰 Guild-ku', description: g ? `Lv.${levelGuild(g)} · ${anggotaGuild(g.id).length} anggota` : 'belum punya', id: `${P}guildku` },
            { title: '📋 Misi Mingguan', description: 'hadiah 15.000 koin + permata', id: `${P}guildmisi` },
            { title: '💰 Donasi', description: 'naikkan level guild', id: `${P}guilddonasi 1000` },
            { title: '🏆 Peringkat Guild', description: 'guild terkuat server', id: `${P}guildlb` },
            { title: '➕ Buat / Gabung', description: `${P}buatguild atau ${P}joinguild`, id: `${P}guildinfo` }
          ]
        },
        {
          title: '👹 World Boss',
          rows: [
            { title: `${infoBoss().icon} ${infoBoss().nama}`, description: `HP ${fmt(b.hp)}/${fmt(b.hpMax)}`, id: `${P}worldboss` },
            { title: '⚔️ Serang Boss', description: '30 energi, cooldown 2 menit', id: `${P}serangboss` },
            { title: '🏆 Peringkat Kontribusi', description: 'hadiah dibagi proporsional', id: `${P}bossrank` },
            { title: '🎁 Klaim Hadiah', description: b.selesai ? 'boss tumbang!' : 'setelah boss tumbang', id: `${P}bosshadiah` }
          ]
        },
        {
          title: '🔗 Sistem lain (v7)',
          rows: [
            { title: '🛒 Market Antar Pemain', description: 'jual/beli item ke pemain lain', id: `${P}marketbuka` },
            { title: '🍳 Masak & Alkimia', description: 'buff ATK/DEF/luck sementara', id: `${P}resepmasakan` },
            { title: '💎 Permata (socket)', description: 'bonus ke senjata/armor', id: `${P}permata` },
            { title: '🐄 Peternakan', description: 'ayam/sapi/domba ber-timer', id: `${P}kandangku` },
            { title: '🏠 Rumah & Dekorasi', description: 'bonus regen & koin', id: `${P}rumahku` },
            { title: '🏺 Relik', description: 'pasif langka', id: `${P}relik` },
            { title: '🔥 Rebirth (prestige)', description: 'reset level, pengali permanen', id: `${P}rebirthinfo` },
            { title: '📅 Hadiah Harian', description: `streak ${r.streak.hari} hari`, id: `${P}hadiahharian` },
            { title: '🏟️ Turnamen Mingguan', description: 'adu statistik antar pemain', id: `${P}turnamenv7` },
            { title: '🍂 Musim', description: musimIni().nama + ' — ' + musimIni().desc, id: `${P}musim` }
          ]
        }
      ]
    }).catch(() => m.reply(`⚔️ RPG v7: ${P}jobinfo · ${P}skill · ${P}guildku · ${P}worldboss · ${P}marketbuka · ${P}resepmasakan · ${P}permata · ${P}kandangku · ${P}rumahku · ${P}relik · ${P}rebirthinfo · ${P}hadiahharian · ${P}turnamenv7 · ${P}musim`))
  })
]

export default { jobCmds, skillCmds, guildCmds, bossCmds, menuV7 }
