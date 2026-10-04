/**
 * features/stalker.js — 🕵️ STALKER (v7.30.0)
 *  .tiktokstalk .igstalk .githubstalk .fbstalk .ytstalk .robloxstalk
 *  v7.30.0: + .threadsstalk .pinstalk .steamstalk .mcstalk .chessstalk .spotifystalk .telestalk .npmstalk
 *           + .igdl — downloader Instagram (foto/video/carousel) & .igpost (postingan terbaru akun)
 *  Semua tanpa API key: TikTok (UNIVERSAL_DATA), Instagram (web_profile_info),
 *  GitHub (api.github.com), Facebook (og meta), YouTube (ytInitialData), Roblox (users/thumbnails API).
 *  Hasil dikirim sebagai FOTO profil + caption info.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
const n = v => Number(v || 0).toLocaleString('id-ID')
const ringkas = v => { v = Number(v || 0); return v >= 1e9 ? (v / 1e9).toFixed(1) + 'M' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'jt' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'rb' : String(v) }
const dekode = s => String(s || '').replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
async function teks (url, headers = {}) { const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'id,en;q=0.8', ...headers }, signal: AbortSignal.timeout(20000), redirect: 'follow' }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text() }
async function json (url, headers = {}, opt = {}) { const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(20000), ...opt }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() }
const ambilUser = m => String(m.q || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?(tiktok\.com\/@|instagram\.com\/|github\.com\/|facebook\.com\/|youtube\.com\/(@|channel\/|c\/)?|roblox\.com\/users\/)?/i, '').split(/[/?#\s]/)[0]

/* Instagram hanya menjawab lewat HTTP/2 (HTTP/1.1 → 429) → pakai node:http2 */
async function jsonH2 (host, path, headers = {}) {
  const h2 = await import('node:http2')
  return new Promise((resolve, reject) => {
    const c = h2.connect('https://' + host); const t = setTimeout(() => { c.close(); reject(new Error('timeout')) }, 20000)
    c.on('error', e => { clearTimeout(t); reject(e) })
    const req = c.request({ ':path': path, ':method': 'GET', 'user-agent': UA, accept: '*/*', ...(process.env.IG_COOKIE && /instagram/.test(host) ? { cookie: process.env.IG_COOKIE } : {}), ...headers })
    let st = 0; const bufs = []
    req.on('response', h => { st = h[':status'] }); req.on('data', d => bufs.push(d))
    req.on('end', () => { clearTimeout(t); c.close(); if (st !== 200) return reject(new Error('HTTP ' + st)); try { resolve(JSON.parse(Buffer.concat(bufs).toString())) } catch (e) { reject(e) } })
    req.on('error', e => { clearTimeout(t); c.close(); reject(e) }); req.end()
  })
}

async function kirim (m, foto, caption) {
  if (foto) { try { return await m.sock.sendMessage(m.jid, { image: { url: foto }, caption }, { quoted: m.raw || m }) } catch {} }
  return m.reply(caption)
}
function plug (names, label, contoh, ambil, mentah = false) {
  return {
    command: names, category: 'Internet', limit: 1, cooldown: 5, contoh,
    description: `🕵️ Stalk profil ${label}: foto + info (followers, bio, dll)`,
    run: async m => {
      const u = mentah ? String(m.q || '').trim() : ambilUser(m)
      if (!u) return m.reply(`🕵️ *${label.toUpperCase()} STALK*\n\nContoh: \`${P}${names[0]} ${contoh}\``)
      try { await m.react?.('🕵️') } catch {}
      try { const r = await ambil(u); return kirim(m, r.foto, r.caption + `\n\n_${config.bot.name} • ${label} Stalk_`) } catch (e) { return m.reply(`❌ Gagal ambil profil ${label} "${u}": ${truncate(String(e.message || e), 100)}\nPastikan username benar & akun publik.`) }
    }
  }
}

export const tiktokstalk = plug(['tiktokstalk', 'ttstalk', 'stalktiktok', 'tiktokprofil'], 'TikTok', 'khaby.lame', async u => {
  const html = await teks(`https://www.tiktok.com/@${encodeURIComponent(u)}`)
  const i = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__'); if (i < 0) throw new Error('data profil tidak ditemukan')
  const j = html.indexOf('>', i) + 1; const k = html.indexOf('</script>', j)
  const d = JSON.parse(html.slice(j, k)); const info = d.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo
  if (!info?.user) throw new Error('akun tidak ada / privat')
  const { user, stats } = info
  return { foto: user.avatarLarger || user.avatarMedium, caption: `🎵 *TIKTOK STALK*\n\n▸ Nama: ${user.nickname}\n▸ Username: @${user.uniqueId}${user.verified ? ' ☑️' : ''}\n▸ Followers: ${n(stats.followerCount)} (${ringkas(stats.followerCount)})\n▸ Following: ${n(stats.followingCount)}\n▸ Likes: ${n(stats.heart || stats.heartCount)}\n▸ Video: ${n(stats.videoCount)}\n▸ Privat: ${user.privateAccount ? 'Ya' : 'Tidak'}\n▸ Bio: ${truncate(user.signature || '-', 200)}\n▸ Link: https://tiktok.com/@${user.uniqueId}` }
})

export const igstalk = plug(['igstalk', 'instagramstalk', 'stalkig', 'iginfo'], 'Instagram', 'instagram', async u => {
  let x = null
  let galat = null
  for (const host of ['i.instagram.com', 'www.instagram.com']) {
    try { const d = await jsonH2(host, `/api/v1/users/web_profile_info/?username=${encodeURIComponent(u)}`, { 'x-ig-app-id': '936619743392459' }); x = d.data?.user; if (x) break } catch (e) { galat = e }
  }
  if (!x) try { throw galat || new Error('akun tidak ada') } catch (e) {
    /* IG membatasi (429) → coba og:description dari halaman umum */
    const html = await teks(`https://www.instagram.com/${encodeURIComponent(u)}/`, { 'User-Agent': 'facebookexternalhit/1.1' }).catch(() => '')
    const desk = dekode((html.match(/property="og:description" content="([^"]*)"/) || [])[1] || '')
    const foto = dekode((html.match(/property="og:image" content="([^"]*)"/) || [])[1] || '')
    if (!desk) throw new Error('Instagram membatasi permintaan (' + e.message + '), coba lagi 1-2 menit')
    const g = (desk.match(/([\d.,KMjt]+)\s*(Followers|Pengikut)/i) || [])[1], f = (desk.match(/([\d.,KMjt]+)\s*(Following|Mengikuti)/i) || [])[1], po = (desk.match(/([\d.,KMjt]+)\s*(Posts|Postingan)/i) || [])[1]
    const nama = dekode((html.match(/property="og:title" content="([^"]*)"/) || [])[1] || u).replace(/\s*\(@.*$/, '').replace(/ • Instagram.*$/, '')
    return { foto, caption: `📸 *INSTAGRAM STALK*\n\n▸ Nama: ${nama}\n▸ Username: @${u}\n▸ Followers: ${g || '-'}\n▸ Following: ${f || '-'}\n▸ Postingan: ${po || '-'}\n▸ Bio: ${truncate(desk.split(' - ').slice(1).join(' - ').split(' on Instagram')[0] || '-', 200)}\n▸ Link: https://instagram.com/${u}` }
  }
  if (!x) throw new Error('akun tidak ada')
  return { foto: x.profile_pic_url_hd || x.profile_pic_url, caption: `📸 *INSTAGRAM STALK*\n\n▸ Nama: ${x.full_name || '-'}\n▸ Username: @${x.username}${x.is_verified ? ' ☑️' : ''}\n▸ Followers: ${n(x.edge_followed_by?.count)} (${ringkas(x.edge_followed_by?.count)})\n▸ Following: ${n(x.edge_follow?.count)}\n▸ Postingan: ${n(x.edge_owner_to_timeline_media?.count)}\n▸ Privat: ${x.is_private ? 'Ya 🔒' : 'Tidak'}\n▸ Bisnis: ${x.is_business_account ? 'Ya' : 'Tidak'}${x.category_name ? ` (${x.category_name})` : ''}\n▸ Bio: ${truncate(x.biography || '-', 220)}\n▸ Link: https://instagram.com/${x.username}` }
})

export const githubstalk = plug(['githubstalk', 'ghstalk', 'stalkgithub', 'github'], 'GitHub', 'torvalds', async u => {
  const x = await json(`https://api.github.com/users/${encodeURIComponent(u)}`)
  let repos = []; try { repos = await json(`https://api.github.com/users/${encodeURIComponent(u)}/repos?sort=updated&per_page=5`) } catch {}
  return { foto: x.avatar_url, caption: `🐙 *GITHUB STALK*\n\n▸ Nama: ${x.name || '-'}\n▸ Username: ${x.login}${x.type === 'Organization' ? ' (Org)' : ''}\n▸ Bio: ${truncate(x.bio || '-', 200)}\n▸ Followers: ${n(x.followers)} · Following: ${n(x.following)}\n▸ Repo publik: ${n(x.public_repos)} · Gist: ${n(x.public_gists)}\n▸ Perusahaan: ${x.company || '-'}\n▸ Lokasi: ${x.location || '-'}\n▸ Blog: ${x.blog || '-'}\n▸ Bergabung: ${new Date(x.created_at).toLocaleDateString('id-ID')}\n${repos.length ? `\n📦 *Repo terbaru:*\n${repos.map(r => `• ${r.name} ⭐${r.stargazers_count}${r.language ? ` · ${r.language}` : ''}`).join('\n')}\n` : ''}▸ Link: ${x.html_url}` }
})

export const fbstalk = plug(['fbstalk', 'facebookstalk', 'stalkfb', 'fbinfo'], 'Facebook', 'zuck', async u => {
  const html = await teks(`https://www.facebook.com/${encodeURIComponent(u)}`, { 'User-Agent': 'facebookexternalhit/1.1' })
  const og = k => dekode((html.match(new RegExp(`property="og:${k}" content="([^"]*)"`)) || html.match(new RegExp(`content="([^"]*)" property="og:${k}"`)) || [])[1] || '')
  const judul = og('title'); if (!judul) throw new Error('profil tidak bisa dibaca (privat / login diperlukan)')
  const desk = og('description')
  const suka = (desk.match(/([\d.,]+)\s*(likes|suka)/i) || [])[1], bicara = (desk.match(/([\d.,]+)\s*(talking|membicarakan)/i) || [])[1], followers = (desk.match(/([\d.,]+)\s*(followers|pengikut)/i) || [])[1]
  return { foto: og('image'), caption: `📘 *FACEBOOK STALK*\n\n▸ Nama: ${judul}\n▸ Username: ${u}${suka ? `\n▸ Suka: ${suka}` : ''}${followers ? `\n▸ Pengikut: ${followers}` : ''}${bicara ? `\n▸ Membicarakan: ${bicara}` : ''}\n▸ Keterangan: ${truncate(desk.replace(/^[^.]*\.\s*/, '') || '-', 220)}\n▸ Link: ${og('url') || 'https://facebook.com/' + u}` }
})

export const ytstalk = plug(['ytstalk', 'youtubestalk', 'stalkyt', 'ytchannel'], 'YouTube', 'MrBeast', async u => {
  const target = /^UC[\w-]{20,}$/.test(u) ? `channel/${u}` : `@${u}`
  const html = await teks(`https://www.youtube.com/${target}/about?hl=id`)
  const i = html.indexOf('var ytInitialData = '); const j = html.indexOf('};</script>', i)
  if (i < 0) throw new Error('channel tidak ditemukan')
  const d = JSON.parse(html.slice(i + 20, j + 1))
  const meta = d.metadata?.channelMetadataRenderer || {}
  const semua = JSON.stringify(d)
  const sub = (semua.match(/"subscriberCountText":"([^"]+)"/) || semua.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/) || [])[1] || '-'
  const vid = (semua.match(/"videoCountText":"([^"]+)"/) || semua.match(/"videoCountText":\{"runs":\[\{"text":"([^"]+)"/) || [])[1] || '-'
  const avatar = meta.avatar?.thumbnails?.slice(-1)[0]?.url || (semua.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/) || [])[1] || ''
  const tentang = semua
  const negara = (tentang.match(/"country":\{"simpleText":"([^"]+)"/) || [])[1] || '-'
  const tayang = (tentang.match(/"viewCountText":\{"simpleText":"([^"]+)"/) || [])[1] || '-'
  const gabung = ((tentang.match(/"joinedDateText":\{"content":"([^"]+)"/) || tentang.match(/"joinedDateText":\{"runs":\[\{"text":"[^"]*"\},\{"text":"([^"]+)"/) || [])[1] || '-').replace(/^Bergabung pada\s*/i, '')
  return { foto: avatar.replace(/=s\d+/, '=s800'), caption: `▶️ *YOUTUBE STALK*\n\n▸ Channel: ${meta.title || u}\n▸ Handle: ${meta.vanityChannelUrl?.replace(/^.*\//, '') || '@' + u}\n▸ Subscriber: ${sub}\n▸ Video: ${vid}\n▸ Total tayangan: ${tayang}\n▸ Negara: ${negara}\n▸ Bergabung: ${gabung}\n▸ Deskripsi: ${truncate(meta.description || '-', 220)}\n▸ Link: ${meta.channelUrl || 'https://youtube.com/' + target}` }
})

export const robloxstalk = plug(['robloxstalk', 'stalkroblox', 'rbxstalk', 'robloxinfo'], 'Roblox', 'builderman', async u => {
  let id = /^\d+$/.test(u) ? +u : null
  if (!id) { const r = await json('https://users.roblox.com/v1/usernames/users', { 'Content-Type': 'application/json' }, { method: 'POST', body: JSON.stringify({ usernames: [u], excludeBannedUsers: false }) }); id = r.data?.[0]?.id; if (!id) throw new Error('username tidak ada') }
  const [x, av, fr, fo, fi] = await Promise.all([
    json(`https://users.roblox.com/v1/users/${id}`),
    json(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=420x420&format=Png&isCircular=false`).catch(() => null),
    json(`https://friends.roblox.com/v1/users/${id}/friends/count`).catch(() => null),
    json(`https://friends.roblox.com/v1/users/${id}/followers/count`).catch(() => null),
    json(`https://friends.roblox.com/v1/users/${id}/followings/count`).catch(() => null)
  ])
  return { foto: av?.data?.[0]?.imageUrl, caption: `🟥 *ROBLOX STALK*\n\n▸ Nama tampilan: ${x.displayName}\n▸ Username: @${x.name}${x.hasVerifiedBadge ? ' ☑️' : ''}\n▸ User ID: ${x.id}\n▸ Teman: ${n(fr?.count)} · Followers: ${n(fo?.count)} · Following: ${n(fi?.count)}\n▸ Banned: ${x.isBanned ? 'Ya 🚫' : 'Tidak'}\n▸ Bergabung: ${new Date(x.created).toLocaleDateString('id-ID')}\n▸ Deskripsi: ${truncate(x.description || '-', 220)}\n▸ Link: https://www.roblox.com/users/${x.id}/profile` }
})


/* ══════════════ v7.30.0 — stalker baru ══════════════ */
const og = (html, prop) => dekode((html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`, 'i')) || html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${prop}"`, 'i')) || [])[1] || '')
const tgl = ts => new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export const threadsstalk = plug(['threadsstalk', 'stalkthreads', 'threadsinfo', 'thstalk'], 'Threads', 'zuck', async u => {
  const html = await teks(`https://www.threads.net/@${encodeURIComponent(u)}`, { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/124', 'Accept-Language': 'en' }) /* UA pendek → Threads kirim meta OG */
  const desc = og(html, 'og:description'); const foto = og(html, 'og:image'); const judul = og(html, 'og:title')
  if (!desc && !foto) throw new Error('akun tidak ditemukan')
  const [f, th, ...bio] = desc.split(/\s*•\s*/)
  return { foto, caption: `🧵 *THREADS STALK*\n\n▸ Nama: ${judul.replace(/\s*\(@.*$/, '') || u}\n▸ Username: @${u}\n▸ Followers: ${f || '-'}\n▸ Threads: ${th || '-'}\n▸ Bio: ${truncate(bio.join(' • ').replace(/See the latest conversations.*$/i, '').trim() || '-', 200)}\n▸ Link: https://www.threads.net/@${u}` }
})
export const pinstalk = plug(['pinstalk', 'pintereststalk', 'stalkpinterest', 'pinprofil'], 'Pinterest', 'nasa', async u => {
  const d = (await json(`https://api.pinterest.com/v3/pidgets/users/${encodeURIComponent(u)}/pins/`)).data
  if (!d?.user) throw new Error('akun tidak ditemukan')
  const x = d.user; const pins = d.pins || []
  return { foto: (x.image_small_url || '').replace(/\/\d+x\d+_RS\//, '/280x280_RS/'), caption: `📌 *PINTEREST STALK*\n\n▸ Nama: ${x.full_name}\n▸ Username: @${u}\n▸ Followers: ${n(x.follower_count)}\n▸ Pin: ${n(x.pin_count)}\n▸ Tentang: ${truncate(dekode(x.about) || '-', 160)}\n▸ Pin terbaru: ${pins.slice(0, 3).map(p => truncate(p.description?.trim() || p.board?.name || 'pin', 40)).join(' · ') || '-'}\n▸ Link: ${x.profile_url}` }
})
export const steamstalk = plug(['steamstalk', 'stalksteam', 'steaminfo', 'steamprofil'], 'Steam', 'gabelogannewell', async u => {
  const id64 = /^\d{17}$/.test(u)
  const xml = await teks(`https://steamcommunity.com/${id64 ? 'profiles' : 'id'}/${encodeURIComponent(u)}/?xml=1`)
  const g = tag => dekode(((xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)) || [])[1] || '').trim())
  if (!g('steamID64')) throw new Error(g('error') || 'profil tidak ditemukan')
  const games = [...xml.matchAll(/<mostPlayedGame>[\s\S]*?<gameName><!\[CDATA\[(.*?)\]\]>[\s\S]*?<hoursOnRecord>(.*?)<\/hoursOnRecord>/g)].slice(0, 3)
  return { foto: g('avatarFull'), caption: `🎮 *STEAM STALK*\n\n▸ Nama: ${g('steamID')}${g('realname') ? ` (${g('realname')})` : ''}\n▸ SteamID64: ${g('steamID64')}\n▸ Status: ${g('stateMessage').replace(/<br\/?>/g, ' ')}\n▸ Privasi: ${g('privacyState')}\n▸ Member sejak: ${g('memberSince') || '-'}\n▸ Lokasi: ${g('location') || '-'}\n▸ VAC: ${g('vacBanned') === '1' ? '🚫 banned' : '✅ bersih'}\n▸ Ringkasan: ${truncate(g('summary').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), 150) || '-'}${games.length ? `\n▸ Paling dimainkan: ${games.map(x => `${x[1]} (${x[2]} jam)`).join(', ')}` : ''}\n▸ Link: https://steamcommunity.com/${id64 ? 'profiles' : 'id'}/${u}` }
})
export const mcstalk = plug(['mcstalk', 'minecraftstalk', 'stalkmc', 'mcskin', 'minecraftskin'], 'Minecraft', 'Notch', async u => {
  const p = await json(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(u)}`).catch(() => null)
  if (!p?.id) throw new Error('username Minecraft (Java) tidak ditemukan')
  let skin = '', cape = false
  try { const s = await json(`https://sessionserver.mojang.com/session/minecraft/profile/${p.id}`); const tx = JSON.parse(Buffer.from(s.properties?.[0]?.value || '', 'base64').toString() || '{}').textures || {}; skin = tx.SKIN?.url || ''; cape = !!tx.CAPE } catch {}
  const uuid = p.id.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
  return { foto: `https://mc-heads.net/body/${p.id}/300`, caption: `⛏️ *MINECRAFT STALK*\n\n▸ Nama: ${p.name}\n▸ UUID: ${uuid}\n▸ Skin: ${skin ? 'ada (' + (skin.includes('slim') ? 'slim' : 'classic') + ')' : 'default'}\n▸ Cape: ${cape ? '✅ punya' : '❌ tidak'}\n▸ Kepala: https://mc-heads.net/avatar/${p.id}/128\n▸ NameMC: https://namemc.com/profile/${p.id}` }
})
export const chessstalk = plug(['chessstalk', 'stalkchess', 'chesscom', 'chessinfo'], 'Chess.com', 'hikaru', async u => {
  const p = await json(`https://api.chess.com/pub/player/${encodeURIComponent(u.toLowerCase())}`)
  const s = await json(`https://api.chess.com/pub/player/${encodeURIComponent(u.toLowerCase())}/stats`).catch(() => ({}))
  const r = k => s[k]?.last?.rating ? `${s[k].last.rating} (best ${s[k].best?.rating || '-'})` : '-'
  const rec = k => s[k]?.record ? `${s[k].record.win}M/${s[k].record.loss}K/${s[k].record.draw}S` : ''
  return { foto: p.avatar || '', caption: `♟️ *CHESS.COM STALK*\n\n▸ Nama: ${p.name || p.username}\n▸ Username: ${p.username}${p.title ? ` · ${p.title}` : ''}\n▸ Status: ${p.status}\n▸ Followers: ${n(p.followers)}\n▸ Negara: ${(p.country || '').split('/').pop() || '-'}\n▸ Bergabung: ${tgl(p.joined * 1000)}\n▸ Terakhir online: ${tgl(p.last_online * 1000)}\n▸ Rapid: ${r('chess_rapid')} ${rec('chess_rapid')}\n▸ Blitz: ${r('chess_blitz')} ${rec('chess_blitz')}\n▸ Bullet: ${r('chess_bullet')} ${rec('chess_bullet')}\n▸ Puzzle: ${s.tactics?.highest?.rating || '-'}\n▸ Link: ${p.url}` }
})
export const spotifystalk = plug(['spotifystalk', 'stalkspotify', 'artisspotify', 'spotifyartis'], 'Spotify', 'The Weeknd', async u => {
  const url = /open\.spotify\.com\//.test(u) ? u.split('?')[0] : ''
  if (url) { /* link Spotify → halaman OG (nama, "monthly listeners", cover) + oembed */
    const html = await teks(url, { 'User-Agent': 'Mozilla/5.0' })
    const title = og(html, 'og:title'); const desc = og(html, 'og:description'); const foto = og(html, 'og:image')
    if (!title) throw new Error('halaman Spotify tidak terbaca')
    return { foto, caption: `🎧 *SPOTIFY STALK*\n\n▸ Nama: ${title}\n▸ Info: ${desc || '-'}\n▸ Tipe: ${(url.match(/open\.spotify\.com\/(?:intl-\w+\/)?(\w+)/) || [])[1] || 'artist'}\n▸ Link: ${url}` }
  }
  /* nama artis → data artis (Deezer, tanpa key) + top track + link pencarian Spotify */
  const r = await json(`https://api.deezer.com/search/artist?q=${encodeURIComponent(u)}&limit=1`); const a = r?.data?.[0]; if (!a) throw new Error('artis tidak ditemukan')
  const top = await json(`https://api.deezer.com/artist/${a.id}/top?limit=5`).catch(() => ({ data: [] }))
  return { foto: a.picture_xl || a.picture_big, caption: `🎧 *SPOTIFY STALK* · artis\n\n▸ Artis: ${a.name}\n▸ Fans: ${n(a.nb_fan)}\n▸ Album: ${n(a.nb_album)}\n▸ Top lagu: ${(top.data || []).map((t, i) => `\n   ${i + 1}. ${t.title} (${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')})`).join('') || '-'}\n▸ Spotify: https://open.spotify.com/search/${encodeURIComponent(a.name)}/artists\n▸ Putar: \`${P}play2 ${a.name}\`\n_kirim link open.spotify.com/artist/... untuk data "monthly listeners"_` }
}, true)
export const telestalk = plug(['telestalk', 'telegramstalk', 'stalktelegram', 'tginfo', 'tgstalk'], 'Telegram', 'telegram', async u => {
  const html = await teks(`https://t.me/${encodeURIComponent(u)}`)
  const foto = (html.match(/tgme_page_photo_image[^>]*src="([^"]+)"/) || [])[1] || og(html, 'og:image')
  const nama = dekode((html.match(/tgme_page_title[^>]*>\s*<span[^>]*>([^<]*)/) || [])[1] || og(html, 'og:title'))
  const extra = dekode((html.match(/tgme_page_extra">\s*([^<]*)/) || [])[1] || '').trim()
  const desc = dekode((html.match(/tgme_page_description[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '').replace(/<br\/?>/g, '\n').replace(/<[^>]+>/g, '')
  if (!nama || /^Telegram: Contact/.test(nama)) throw new Error('username/channel tidak ditemukan')
  const tipe = /subscribers/.test(extra) ? 'Channel' : /members/.test(extra) ? 'Grup' : html.includes('tgme_action_button_new') && /Send Message/.test(html) ? 'Pengguna' : 'Bot/Pengguna'
  return { foto, caption: `✈️ *TELEGRAM STALK*\n\n▸ Nama: ${nama}\n▸ Username: @${u}\n▸ Tipe: ${tipe}\n▸ ${extra || '-'}\n▸ Deskripsi: ${truncate(desc.trim() || '-', 200)}\n▸ Link: https://t.me/${u}` }
})
export const npmstalk = plug(['npmstalk', 'npminfo', 'stalknpm', 'npmpkg'], 'NPM', 'express', async u => {
  const d = await json(`https://registry.npmjs.org/${encodeURIComponent(u.toLowerCase())}`)
  if (!d.name) throw new Error('paket tidak ditemukan')
  const dl = await json(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(d.name)}`).catch(() => ({}))
  const v = d['dist-tags']?.latest; const p = d.versions?.[v] || {}
  return { foto: '', caption: `📦 *NPM STALK*\n\n▸ Paket: ${d.name}@${v}\n▸ Deskripsi: ${truncate(d.description || '-', 150)}\n▸ Unduhan/minggu: ${n(dl.downloads)}\n▸ Lisensi: ${p.license || d.license || '-'}\n▸ Dependensi: ${Object.keys(p.dependencies || {}).length}\n▸ Versi: ${Object.keys(d.versions || {}).length} (rilis terakhir ${tgl(d.time?.[v] || Date.now())})\n▸ Maintainer: ${(d.maintainers || []).slice(0, 3).map(x => x.name).join(', ') || '-'}\n▸ Repo: ${(p.repository?.url || '').replace(/^git\+|\.git$/g, '') || '-'}\n▸ Link: https://www.npmjs.com/package/${d.name}` }
})

/* ══════════════ v7.35.0 — INSTAGRAM DOWNLOADER (dibangun ulang) ══════════════
   Lapisan 1 (utama): oembed → feed pemilik (HTTP/2 + fallback HTTP/1.1, retry + rotasi app-id).
   Lapisan 2 (video/reels): yt-dlp — butuh binari terpasang (Railway: sudah ada; Termux: pkg install yt-dlp).
   Embed/captioned DIHAPUS (sejak 2025 IG hanya mengirim cangkang JS tanpa media — diverifikasi 09-2026).
   IG_COOKIE (env Railway, 'sessionid=...; ds_user_id=...' dari browser) dipakai lapisan 1 & 2. */
const IG_APP = { 'x-ig-app-id': '936619743392459', ...(process.env.IG_COOKIE ? { cookie: process.env.IG_COOKIE } : {}) }
const IG_APP_IDS = ['936619743392459', '1217981644879628', '567310203415052']
export function shortcodeIG (s) { const m = String(s || '').match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]{5,})/); return m ? m[1] : (/^[A-Za-z0-9_-]{8,15}$/.test(String(s || '').trim()) ? String(s).trim() : '') }
/** klasifikasikan galat jaringan IG → kode yang bisa dijelaskan ke user */
export function artiGalatIG (e) {
  const s = String(e?.message || e || '')
  if (/429|rate.?limit|feedback_required|wait a few|temporarily blocked/i.test(s)) return 'ratelimit'
  if (/login_required|challenge_required|\b403\b/i.test(s)) return 'login'
  if (/\b404\b|No Media Match|not found|invalid shortcode/i.test(s)) return 'tidakada'
  if (/private|\b401\b|unauthorized/i.test(s)) return 'privat'
  if (/timeout|timed out|ENOTFOUND|ECONN|EAI_AGAIN|fetch failed|HTTP 5|socket hang/i.test(s)) return 'jaringan'
  return 'lain'
}
const saranIG = {
  ratelimit: '⏳ *Instagram membatasi IP server (rate-limit).* Tunggu ±1 menit lalu ulangi perintah yang sama. Kalau sering terjadi, owner bisa pasang `IG_COOKIE` di Railway (sessionid browser) supaya limit jauh lebih longgar.',
  login: '🔐 *Instagram meminta login dari IP server ini.* Solusi: owner pasang `IG_COOKIE` (`sessionid=...; ds_user_id=...` dari browser) di Railway → Variables, lalu ulangi.',
  tidakada: '❌ *Postingan tidak ditemukan.* Cek lagi link-nya (mungkin salah salin / sudah dihapus pemiliknya).',
  privat: '🔒 *Akun privat.* Hanya postingan akun PUBLIK yang bisa diunduh tanpa login.',
  jaringan: '🌐 *Gangguan jaringan ke Instagram.* Coba lagi beberapa saat.',
  lain: '❌ *Gagal mengambil data Instagram.* Coba lagi, atau pakai link postingan lain.'
}
/* GET JSON ke API IG: 2x percobaan, tiap percobaan HTTP/2 lalu fallback HTTP/1.1 */
async function igAmbil (host, path) {
  let akhir = new Error('gagal')
  for (let a = 0; a < 2; a++) {
    const headers = { 'x-ig-app-id': IG_APP_IDS[a % IG_APP_IDS.length], ...(process.env.IG_COOKIE && /instagram/.test(host) ? { cookie: process.env.IG_COOKIE } : {}) }
    for (const via of ['h2', 'h1']) {
      try {
        if (via === 'h2') return await jsonH2(host, path, headers)
        const r = await fetch('https://' + host + path, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(20000) })
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return await r.json()
      } catch (e) { akhir = e; if (!/429|HTTP 5|timeout|timed out|fetch failed|ECONN|socket hang/i.test(String(e.message || e))) break }
    }
    await new Promise(r => setTimeout(r, 1200 + a * 1500))
  }
  throw akhir
}
function mediaDariItem (it) {
  const satu = x => x.video_versions?.length ? { tipe: 'video', url: x.video_versions[0].url, thumb: x.image_versions2?.candidates?.[0]?.url } : { tipe: 'foto', url: x.image_versions2?.candidates?.[0]?.url }
  const list = it.carousel_media?.length ? it.carousel_media.map(satu) : [satu(it)]
  return list.filter(x => x.url)
}
export async function ambilPostIG (sc) {
  let o = null; let galatFeed = null
  try {
    o = await igAmbil('i.instagram.com', `/api/v1/oembed/?url=${encodeURIComponent('https://www.instagram.com/p/' + sc + '/')}`)
  } catch (e) {
    const er = new Error('oembed: ' + (e.message || e)); er.kode = artiGalatIG(e); throw er
  }
  if (!o?.author_name) { const er = new Error('postingan tidak ditemukan / akun privat'); er.kode = /privat/i.test(o?.gating || '') ? 'privat' : 'tidakada'; throw er }
  let maxId = ''; let item = null
  for (let hal = 0; hal < 3 && !item; hal++) {
    try {
      const d = await igAmbil('www.instagram.com', `/api/v1/feed/user/${encodeURIComponent(o.author_name)}/username/?count=12${maxId ? '&max_id=' + encodeURIComponent(maxId) : ''}`)
      item = (d.items || []).find(x => x.code === sc)
      if (!d.more_available || !d.next_max_id) break
      maxId = d.next_max_id
    } catch (e) { galatFeed = e; break }
  }
  if (galatFeed && o.thumbnail_url) return { pemilik: o.author_name, judul: o.title || '', media: [{ tipe: 'foto', url: o.thumbnail_url, thumb: true }], sebagian: true, kode: artiGalatIG(galatFeed) }
  if (galatFeed) { const er = new Error('feed: ' + (galatFeed.message || galatFeed)); er.kode = artiGalatIG(galatFeed); throw er }
  if (!item) return { pemilik: o.author_name, judul: o.title, media: o.thumbnail_url ? [{ tipe: 'foto', url: o.thumbnail_url, thumb: true }] : [], sebagian: true, kode: 'terkubur' }
  return { pemilik: o.author_name, judul: item.caption?.text || o.title || '', like: item.like_count, komen: item.comment_count, view: item.play_count || item.view_count, tanggal: item.taken_at ? tgl(item.taken_at * 1000) : '', media: mediaDariItem(item) }
}
/* Lapisan 2: yt-dlp — khusus VIDEO (foto/carousel-foto tidak didukung yt-dlp) */
export async function unduhIGYtDlp (sc) {
  const { execFile } = await import('node:child_process')
  const fs = await import('node:fs')
  const path = await import('node:path')
  const jalan = (bin, args, timeout) => new Promise((res, rej) => execFile(bin, args, { timeout }, (e, stdout, stderr) => e ? rej(Object.assign(e, { stderr: String(stderr || '') })) : res(stdout)))
  try { await jalan('yt-dlp', ['--version'], 15000) } catch (e) {
    if (/ENOENT|not found|tidak dikenal/i.test(String(e.message || '') + (e.stderr || ''))) { const er = new Error('yt-dlp belum terpasang di server ini'); er.kode = 'tanpaytdlp'; throw er }
  }
  const dir = config.tmpFolder || '/tmp'
  const out = path.join(dir, `ig_${Date.now()}.%(ext)s`)
  const args = ['--no-warnings', '--no-playlist', '--no-check-certificate', '-f', 'best[ext=mp4]/best', '--user-agent', UA, '-o', out]
  if (process.env.IG_COOKIE) args.push('--add-header', `Cookie:${process.env.IG_COOKIE}`)
  args.push(`https://www.instagram.com/p/${sc}/`)
  try {
    await jalan('yt-dlp', args, 120000)
  } catch (e) {
    const lg = String(e.stderr || '') + String(e.message || '')
    if (/No video formats|no video/i.test(lg)) { const er = new Error('postingan ini FOTO — yt-dlp hanya bisa mengunduh video/reels'); er.kode = 'foto'; throw er }
    if (/login|cookies|rate-limit|429/i.test(lg)) { const er = new Error('yt-dlp ditolak Instagram: ' + truncate(lg, 120)); er.kode = artiGalatIG(lg); throw er }
    const er = new Error('yt-dlp gagal: ' + truncate(lg, 120)); er.kode = 'lain'; throw er
  }
  const awal = path.basename(out).split('.')[0]
  const f = fs.readdirSync(dir).find(x => x.startsWith(awal))
  if (!f) { const er = new Error('yt-dlp tidak menghasilkan file'); er.kode = 'lain'; throw er }
  const fp = path.join(dir, f)
  const buf = fs.readFileSync(fp)
  try { fs.unlinkSync(fp) } catch {}
  return { buf, nama: f }
}
export const igdl = {
  command: ['igdl', 'ig', 'instagram', 'igdownload', 'igvideo', 'igfoto', 'reels', 'instadl'],
  category: 'Downloader', limit: 1, cooldown: 8, contoh: 'https://www.instagram.com/reel/Dcgs4DvIr3u/',
  description: '📥 Downloader Instagram: foto / video / reels / carousel (akun publik) — kirim link postingan',
  run: async m => {
    const sc = shortcodeIG(m.q)
    if (!sc) return m.reply(`📥 *INSTAGRAM DOWNLOADER*\n\nKirim link postingan/reels:\n\`${P}igdl https://www.instagram.com/reel/xxxx/\`\n\nJuga ada: \`${P}igpost <username>\` (unduh postingan terbaru akun) · \`${P}igstalk <username>\``)
    try { await m.react?.('📥') } catch {}
    let r = null; let kode = 'lain'; let detail = ''
    try { r = await ambilPostIG(sc) } catch (e) { kode = e.kode || artiGalatIG(e); detail = e.message }
    /* lapisan 2: yt-dlp (video) bila lapisan 1 gagal total / hanya thumbnail */
    if (!r || !r.media.length || r.sebagian) {
      try {
        const y = await unduhIGYtDlp(sc)
        await m.sock.sendMessage(m.jid, { video: y.buf, caption: `📥 *INSTAGRAM* (yt-dlp) · @${r?.pemilik || '?'}\n_${config.bot.name} • IG Downloader_`, mimetype: 'video/mp4' }, { quoted: m.raw || m })
        return
      } catch (e) { if (!r?.media.length) { kode = e.kode || artiGalatIG(e); detail = e.message } }
    }
    if (!r || !r.media.length) return m.reply(`${saranIG[kode] || saranIG.lain}\n\n_Kode: ${kode}${detail ? ' · ' + truncate(detail, 90) : ''}_`)
    const cap = `📥 *INSTAGRAM* · @${r.pemilik}${r.tanggal ? ` · ${r.tanggal}` : ''}\n${r.like != null ? `❤️ ${ringkas(r.like)} · 💬 ${ringkas(r.komen)}${r.view ? ` · ▶ ${ringkas(r.view)}` : ''}\n` : ''}${r.judul ? `\n${truncate(r.judul, 300)}\n` : ''}${r.sebagian ? `\n_⚠️ hanya thumbnail${r.kode === 'terkubur' ? ' (postingan lama, di luar ±36 terbaru di feed)' : ' (feed dibatasi: ' + (r.kode || '?') + ')'} — video penuh: coba \`${P}igreels https://www.instagram.com/p/${sc}/\`_\n` : ''}\n_${config.bot.name} • IG Downloader_`
    let terkirim = 0
    for (const [i, md] of r.media.slice(0, 10).entries()) {
      let buf = null; let galatMd = ''
      for (let coba = 0; coba < 2 && !buf; coba++) {
        try {
          if (coba) await new Promise(rr => setTimeout(rr, 1200))
          const r2 = await fetch(md.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) }); if (!r2.ok) throw new Error('HTTP ' + r2.status)
          buf = Buffer.from(await r2.arrayBuffer()); if (buf.length > 60 * 1024 * 1024) throw new Error('file terlalu besar')
        } catch (e) { galatMd = e.message }
      }
      if (!buf) { await m.reply(`⚠️ Media ${i + 1} gagal: ${galatMd}`); continue }
      try {
        const pesan = md.tipe === 'video' ? { video: buf, caption: i === 0 ? cap : `(${i + 1}/${Math.min(r.media.length, 10)})`, mimetype: 'video/mp4' } : { image: buf, caption: i === 0 ? cap : `(${i + 1}/${Math.min(r.media.length, 10)})` }
        await m.sock.sendMessage(m.jid, pesan, { quoted: m.raw || m }); terkirim++
      } catch (e) { await m.reply(`⚠️ Media ${i + 1} gagal dikirim: ${e.message}`) }
    }
    if (!terkirim) return m.reply('❌ Semua media gagal diunduh, coba lagi nanti.')
    if (r.media.length > 10) await m.reply(`ℹ️ ${r.media.length - 10} media lainnya tidak dikirim (maks 10).`)
  }
}
export const igpost = {
  command: ['igpost', 'igterbaru', 'igfeed', 'igpostingan'],
  category: 'Downloader', limit: 1, cooldown: 8, contoh: 'cristiano 3',
  description: '📥 Unduh N postingan TERBARU akun Instagram publik (default 1, maks 5): .igpost <username> [jumlah]',
  run: async m => {
    const [u0, j0] = String(m.q || '').trim().split(/\s+/); const u = String(u0 || '').replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '')
    if (!u) return m.reply(`📥 *IG POST TERBARU*\n\n\`${P}igpost <username> [jumlah 1-5]\`\nContoh: \`${P}igpost cristiano 3\``)
    const jml = Math.min(5, Math.max(1, parseInt(j0) || 1))
    try { await m.react?.('📥') } catch {}
    let d
    try { d = await igAmbil('www.instagram.com', `/api/v1/feed/user/${encodeURIComponent(u)}/username/?count=${jml}`) } catch (e) { const k = artiGalatIG(e); return m.reply(`${saranIG[k]}\n\n_Kode: ${k}_`) }
    const items = (d.items || []).slice(0, jml); if (!items.length) return m.reply('❌ Tidak ada postingan / akun privat.')
    for (const it of items) {
      const md = mediaDariItem(it)[0]; if (!md) continue
      try {
        const buf = Buffer.from(await (await fetch(md.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) })).arrayBuffer())
        const cap = `📥 @${u} · https://www.instagram.com/p/${it.code}/\n❤️ ${ringkas(it.like_count)} · 💬 ${ringkas(it.comment_count)}${it.carousel_media?.length ? ` · 🖼️ ${it.carousel_media.length} media (kirim \`${P}igdl ${it.code}\` untuk semua)` : ''}\n\n${truncate(it.caption?.text || '', 250)}`
        await m.sock.sendMessage(m.jid, md.tipe === 'video' ? { video: buf, caption: cap, mimetype: 'video/mp4' } : { image: buf, caption: cap }, { quoted: m.raw || m })
      } catch (e) { await m.reply(`⚠️ ${it.code} gagal: ${e.message}`) }
    }
  }
}

export default { tiktokstalk, igstalk, githubstalk, fbstalk, ytstalk, robloxstalk, threadsstalk, pinstalk, steamstalk, mcstalk, chessstalk, spotifystalk, telestalk, npmstalk, igdl, igpost }
