/**
 * 🕹️ ARCADE v7.6 — barrel 5 game neon baru
 * ------------------------------------------------------------------
 *  Menggabungkan lib/arcade6.js (missile, lukis, lander) dan
 *  lib/arcade7.js (spiral, bomber) menjadi satu daftar + deskripsi,
 *  supaya features/arcade.js dan features/arcadebaru.js tidak perlu
 *  saling mengimpor (menghindari siklus modul).
 */
import { missileHtml, painterHtml, landerHtml, ARCADE6 } from './arcade6.js'
import { spiralHtml, bomberHtml, ARCADE7 } from './arcade7.js'

export { missileHtml, painterHtml, landerHtml, spiralHtml, bomberHtml, ARCADE6, ARCADE7 }

/** deskripsi singkat tiap game (dipakai menu & deskripsi plugin) */
export const KET_ARCADE4 = {
  missile: 'hujan rudal menghantam 3 kota: ▲▼◀▶ arahkan crosshair, ● luncurkan pencegat dari baterai terdekat · ledakan menghancurkan rudal · 6 gelombang',
  lukis: 'cat 75% grid untuk naik level: ▲▼◀▶ geser kuas, rantai cat panjang = poin besar · percik api memangkas nyawa · makin tinggi level makin cepat',
  lander: 'fisika roket sungguhan: ▲ tahan untuk menyalakan mesin, ◀▶ putar kapal, ▼ rem samping · mendarat di garis hijau dengan kecepatan & sudut aman · bahan bakar terbatas',
  spiral: 'geser menara supaya bola masuk celah cincin: ◀▶ geser (tahan untuk halus) · celah tengah = bonus · level naik tiap 12 cincin, celah makin sempit',
  bomber: 'pasang bom untuk menghancurkan grid & musuh: ▲▼◀▶ jalan (tahan tombol untuk terus bergerak), ● pasang bom · ledakan berbentuk + setelah 2 detik · power-up'
}

/** 5 game arcade v7.6 dalam bentuk daftar standar (id/cmd/icon/nama/ket/ratio/html) */
export const ARCADE_4 = [...ARCADE6, ...ARCADE7].map(g => ({
  id: g.id,
  cmd: g.cmd || g.id,
  icon: g.icon,
  nama: g.nama,
  title: g.title || g.nama,
  ket: KET_ARCADE4[g.id] || 'game arcade neon HTML app',
  ratio: g.ratio,
  w: g.w,
  h: g.h,
  kind: g.id,
  html: g.html
}))

export default ARCADE_4
