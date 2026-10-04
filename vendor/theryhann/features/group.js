/**
 * 👥 GROUP MENU — kelola grup
 */
import { config } from '../config.js'
import { getGroup, saveNow } from '../lib/database.js'
import { aliasesOf, anyMatch, findParticipant, isOwnerIdentity } from '../lib/identity.js'

export default {
  command: ['group', 'grup'],
  category: 'Group Menu',
  description: 'Buka/tutup grup',
  group: true,
  admin: true,
  botAdmin: true,
  limit: 0,
  run: async (m) => {
    const val = (m.q || m.args[0] || '').toLowerCase()
    if (['open', 'buka', '1'].includes(val)) {
      await m.sock.groupSettingUpdate(m.jid, 'not_announcement')
      return m.reply('✅ Grup dibuka — semua member bisa kirim pesan.')
    }
    if (['close', 'tutup', '0'].includes(val)) {
      await m.sock.groupSettingUpdate(m.jid, 'announcement')
      return m.reply('🔒 Grup ditutup — hanya admin yang bisa kirim pesan.')
    }
    return m.sendButtons({
      title: '👥 Group Setting',
      text: `*Grup:* ${m.groupName}\n*Status:* ${m.group?.announce ? '🔒 Tertutup' : '🌐 Terbuka'}\n\nPilih aksi:`,
      buttons: [
        { text: '🌐 Buka Grup', id: '.group open' },
        { text: '🔒 Tutup Grup', id: '.group close' },
        { text: 'ℹ️ Info Grup', id: '.groupinfo' }
      ]
    })
  }
}

export const linkgroup = {
  command: ['linkgroup', 'linkgc', 'link'],
  category: 'Group Menu',
  description: 'Ambil link invite grup',
  group: true,
  botAdmin: true,
  limit: 0,
  run: async (m) => {
    const code = await m.sock.groupInviteCode(m.jid)
    return m.sendInteractive({
      title: '🔗 Link Grup',
      body: `*${m.groupName}*\n\n${'https://chat.whatsapp.com/' + code}`,
      footer: config.bot.footer,
      copy: [{ text: '📋 Salin Link', code: 'https://chat.whatsapp.com/' + code }]
    }).catch(() => m.reply('https://chat.whatsapp.com/' + code))
  }
}

export const groupInfo = {
  command: ['groupinfo', 'infogrup', 'infogc'],
  category: 'Group Menu',
  description: 'Informasi grup',
  group: true,
  limit: 0,
  run: async (m) => {
    const meta = m.group || {}
    const g = getGroup(m.jid)
    const admins = (meta.participants || []).filter(p => p.admin).length
    const text = `*👥 INFO GRUP*

▸ *Nama:* ${meta.subject || '-'}
▸ *ID:* ${m.jid}
▸ *Dibuat:* ${meta.creation ? new Date(meta.creation * 1000).toLocaleDateString('id-ID') : '-'}
▸ *Owner Grup:* ${meta.owner ? '@' + meta.owner.split('@')[0] : '-'}
▸ *Member:* ${(meta.participants || []).length}
▸ *Admin:* ${admins}
▸ *Status:* ${meta.announce ? '🔒 Tertutup' : '🌐 Terbuka'}
▸ *Deskripsi:*
${(meta.desc || '-').slice(0, 700)}

*⚙️ SETTING BOT DI GRUP INI*
▸ Welcome: ${g.welcome ? '✅' : '❌'}
▸ Anti Link: ${g.antilink ? '✅' : '❌'}
▸ Anti Delete: ${g.antidelete ? '✅' : '❌'}
▸ Anti Toxic: ${g.antitoxic ? '✅' : '❌'}
▸ Auto AI: ${g.autoai ? '✅' : '❌'}
▸ Mute: ${g.mute ? '✅' : '❌'}`
    return m.sendButtons({
      title: '👥 ' + (meta.subject || 'Grup'),
      text,
      buttons: [
        { text: '⚙️ Setting Grup', id: '.setgrup' },
        { text: '🏠 Menu', id: 'act:menu:main' }
      ]
    }).catch(() => m.reply(text))
  }
}

export const setGroup = {
  command: ['setgrup', 'setgroup', 'groupset'],
  category: 'Group Menu',
  description: 'Nyalakan/matikan fitur grup',
  group: true,
  admin: true,
  limit: 0,
  run: async (m) => {
    const g = getGroup(m.jid)
    const key = (m.args[0] || '').toLowerCase()
    const map = {
      welcome: 'welcome', antilink: 'antilink', antidelete: 'antidelete',
      antitoxic: 'antitoxic', autoai: 'autoai', mute: 'mute', antitagsw: 'antitagsw',
      1: 'welcome', 2: 'antilink', 3: 'antidelete', 4: 'antitoxic', 5: 'autoai', 6: 'mute', 7: 'antitagsw'
    }
    if (key && map[key]) {
      g[map[key]] = !g[map[key]]
      saveNow('groups')
      return m.reply(`${g[map[key]] ? '✅' : '❌'} *${map[key]}* sekarang ${g[map[key]] ? 'AKTIF' : 'NONAKTIF'} di grup ini.`)
    }
    const p = config.display.prefix
    return m.sendList({
      title: '⚙️ Setting Grup',
      text: `*⚙️ FITUR GRUP — ${m.groupName}*\n\n▸ Welcome: ${g.welcome ? '✅' : '❌'}\n▸ Anti Link: ${g.antilink ? '✅' : '❌'}\n▸ Anti Delete: ${g.antidelete ? '✅' : '❌'}\n▸ Anti Toxic: ${g.antitoxic ? '✅' : '❌'}\n▸ Auto AI: ${g.autoai ? '✅' : '❌'}\n▸ Mute Bot: ${g.mute ? '✅' : '❌'}\n▸ Anti Tag SW: ${g.antitagsw ? '✅' : '❌'}\n\nPilih untuk toggle 👇`,
      buttonText: '⚙️ Toggle Fitur',
      sections: [
        {
          title: 'Klik untuk ON/OFF',
          rows: [
            { title: `${g.welcome ? '❌' : '✅'} Welcome`, description: 'sambutan member baru', id: `${p}setgrup welcome` },
            { title: `${g.antilink ? '❌' : '✅'} Anti Link`, description: 'hapus pesan berisi link', id: `${p}setgrup antilink` },
            { title: `${g.antidelete ? '❌' : '✅'} Anti Delete`, description: 'laporkan pesan dihapus', id: `${p}setgrup antidelete` },
            { title: `${g.antitoxic ? '❌' : '✅'} Anti Toxic`, description: 'teguran kata kasar', id: `${p}setgrup antitoxic` },
            { title: `${g.autoai ? '❌' : '✅'} Auto AI`, description: 'AI balas semua pesan grup', id: `${p}setgrup autoai` },
            { title: `${g.mute ? '❌' : '✅'} Mute Bot`, description: 'bot diam di grup ini', id: `${p}setgrup mute` },
            { title: `${g.antitagsw ? '❌' : '✅'} Anti Tag SW`, description: 'hapus + warn pengetag SW', id: `${p}setgrup antitagsw` }
          ]
        }
      ]
    }).catch(() => m.reply(`Gunakan: \`${p}setgrup welcome|antilink|antidelete|antitoxic|autoai|mute|antitagsw\``))
  }
}

export const tagAll = {
  command: ['hidetag', 'tagall', 'h'],
  category: 'Group Menu',
  description: 'Tag semua member grup',
  group: true,
  admin: true,
  limit: 0,
  run: async (m) => {
    const participants = (m.group?.participants || []).map(p => p.id)
    const text = m.q || '📢 *Tag All* oleh admin'
    if (m.isMedia || m.quoted?.isMedia) {
      try {
        const d = await m.download()
        const content = d.mime.startsWith('image/')
          ? { image: d.buffer, caption: text, mentions: participants }
          : { video: d.buffer, caption: text, mentions: participants }
        return await m.sock.sendMessage(m.jid, content)
      } catch {}
    }
    return await m.sock.sendMessage(m.jid, { text, mentions: participants })
  }
}

export const kickAdd = {
  command: ['kick', 'add', 'promote', 'demote'],
  category: 'Group Menu',
  description: 'Keluarkan/tambah/naikkan/turunkan member',
  group: true,
  admin: true,
  botAdmin: true,
  limit: 0,
  run: async (m) => {
    /* ----------------------------------------------------------------
     * FIX v7.7 — dua penyebab .kick selalu gagal:
     *  1) action yang sah untuk WhatsApp adalah 'remove', bukan 'kick'
     *     (tag XML diteruskan mentah mentah → server menolak 'kick').
     *  2) identitas target diabaikan mentah mentah; di grup mode LID
     *     mention/reply menghasilkan @lid yang tidak ditulis persis
     *     seperti participant.id → "not in group".
     * ---------------------------------------------------------------- */
    const AKSI = { kick: 'remove', add: 'add', promote: 'promote', demote: 'demote' }
    const aksi = AKSI[m.command] || m.command
    const partisipan = m.group?.participants || []

    const mentah =
      m.mentioned[0] ||
      m.quoted?.sender ||
      (m.args[0] ? m.args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

    if (m.command === 'add') {
      if (!m.q) return m.reply('Contoh: `.add 628xxxxxxxxxx`')
      const targetAdd = m.q.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      try {
        await m.sock.groupParticipantsUpdate(m.jid, [targetAdd], 'add')
        return m.reply('✅ Berhasil menambahkan member.')
      } catch (e) {
        const code = await m.sock.groupInviteCode(m.jid).catch(() => null)
        return m.reply(
          `❌ Gagal menambahkan (kemungkinan privasi nomor dikunci).\nKirim link ini ke target:\nhttps://chat.whatsapp.com/${code || ''}`
        )
      }
    }

    if (!mentah) return m.reply(`Tag / reply / kirim nomor target.\nContoh: \`${config.display.prefix}${m.command} @user\``)

    /* --- resolve target → participant grup (tahan LID <-> PN) --- */
    const kandidat = [...new Set([mentah, ...aliasesOf(mentah)].filter(Boolean))]
    const p = findParticipant(partisipan, kandidat)
    if (!p) {
      return m.reply(
        `❌ @${mentah.split('@')[0]} tidak ditemukan di grup ini.\n` +
        'Mungkin dia sudah keluar, atau identitasnya belum dikenali — ' +
        `coba *balas pesannya* lalu ketik \`${config.display.prefix}${m.command}\`.`,
        { mentions: [mentah] }
      )
    }
    const bentuk = [...new Set([p.id, p.pn, p.lid, ...kandidat].filter(Boolean))]

    if (anyMatch(bentuk, [m.user, ...(m.userAlts || [])])) return m.reply('❌ Tidak bisa ke bot sendiri.')
    if (anyMatch(bentuk, [m.sender, ...(m.senderAlts || [])])) return m.reply('❌ Tidak bisa ke diri sendiri.')
    if (isOwnerIdentity(bentuk, m.owners || [config.owner.number])) return m.reply('❌ Tidak bisa ke owner bot.')

    /* coba bentuk JID satu per satu sampai WhatsApp menerima (status 200) */
    let sukses = null; let status = ''
    for (const j of bentuk) {
      try {
        const r = await m.sock.groupParticipantsUpdate(m.jid, [j], aksi)
        const st = Array.isArray(r) ? String(r[0]?.status ?? '') : ''
        if (!st || st.startsWith('2')) { sukses = j; break }
        status = st
      } catch (e) { status = e?.message || 'error' }
    }
    if (!sukses) {
      return m.reply(`❌ Gagal ${m.command} @${mentah.split('@')[0]} (${status || 'ditolak WhatsApp'}).`, { mentions: [mentah] })
    }
    const label = { kick: 'mengeluarkan', promote: 'mempromosikan', demote: 'menurunkan' }[m.command]
    return m.reply(`✅ Berhasil ${label} @${sukses.split('@')[0]}.`, { mentions: [sukses] })
  }
}

export const setSubjectDesc = {
  command: ['setname', 'setdesc', 'setppgc', 'changename', 'gantinamagrup', 'ubahnamagrup', 'renamegrup', 'cngrup'],
  category: 'Group Menu',
  description: 'Ubah nama/deskripsi/foto grup',
  group: true,
  admin: true,
  botAdmin: true,
  limit: 0,
  run: async (m) => {
    if (['setname', 'changename', 'gantinamagrup', 'ubahnamagrup', 'renamegrup', 'cngrup'].includes(m.command)) {
      const baru = (m.q || '').replace(/\s+/g, ' ').trim()
      if (!baru) return m.reply('Contoh: `.setname Nama Baru`\n\nSyarat: 1–25 karakter, tanpa baris baru.\n_(Ubah *nama orang* dengan font: `.cn <nama>`)_')
      if (baru.length > 25) return m.reply(`❌ Nama kepanjangan: ${baru.length}/25 karakter.`)
      await m.sock.groupUpdateSubject(m.jid, baru)
      return m.reply(`✅ Nama grup diubah jadi *${baru}*.`)
    }
    if (m.command === 'setdesc') {
      if (!m.q) return m.reply('Contoh: `.setdesc Deskripsi baru`')
      await m.sock.groupUpdateDescription(m.jid, m.q)
      return m.reply('✅ Deskripsi grup diubah.')
    }
    // setppgc
    if (!m.isImage && !m.quoted?.isMedia) return m.reply('📷 Reply/kirim gambar dengan caption `.setppgc`')
    const d = await m.download()
    await m.sock.updateProfilePicture(m.jid, d.buffer)
    return m.reply('✅ Foto profil grup diubah.')
  }
}
