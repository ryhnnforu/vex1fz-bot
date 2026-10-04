/**
 * ============================================================
 *  lib/axios-shim.js — MINI AXIOS + MINI FORM-DATA (v7.7.1)
 * ------------------------------------------------------------
 *  Bot ini sengaja tidak memakai paket axios (fetch bawaan cukup).
 *  Shim ini hanya dipakai plugin hasil .addplugin — menyediakan
 *  antarmuka yang dipakai kode gaya BotTelegraf pada umumnya:
 *
 *      axios.get(url, { params, timeout, responseType, headers })
 *      axios.post(url, data, { headers, timeout, maxBodyLength })
 *      new FormData() + append(name, Buffer, { filename, contentType })
 *      form.getHeaders()
 *
 *  Kembalian { data, status, headers, statusText } dibangun dari fetch.
 * ============================================================
 */

export class FormData {
  constructor () {
    this._bagian = []
    this._boundary = '----theryAddPlug' + Math.random().toString(32).slice(2, 18) + Date.now().toString(32)
  }
  append (name, value, opts = {}) {
    let kepala = `--${this._boundary}\r\nContent-Disposition: form-data; name="${String(name).replace(/"/g, '')}"`
    if (opts.filename || opts.fileName) {
      kepala += `; filename="${String(opts.filename || opts.fileName).replace(/"/g, '')}"\r\nContent-Type: ${opts.contentType || 'application/octet-stream'}`
    }
    kepala += '\r\n\r\n'
    this._bagian.push(Buffer.from(kepala), Buffer.isBuffer(value) ? value : Buffer.from(String(value ?? '')), Buffer.from('\r\n'))
  }
  getHeaders () {
    return { 'content-type': `multipart/form-data; boundary=${this._boundary}` }
  }
  toBuffer () {
    return Buffer.concat([...this._bagian, Buffer.from(`--${this._boundary}--\r\n`)])
  }
}

const UA = 'Mozilla/5.0 (Linux; Android 14; SM-A556B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.104 Mobile Safari/537.36'
const t = d => (d ? String(d) : Object.create(null))

function bikinAxiosError (pesan, res) {
  const e = new Error(pesan)
  if (res) { e.response = { status: res.status, statusText: res.statusText }; e.code = 'ERR_BAD_RESPONSE' }
  return e
}

async function bacaIsi (res, tipe) {
  if (tipe === 'arraybuffer' || tipe === 'stream' || tipe === 'blob') return Buffer.from(await res.arrayBuffer())
  const teks = await res.text()
  if (tipe === 'text') return teks
  try { return JSON.parse(teks) } catch { return teks }
}

export async function agGET (url, opt = {}) {
  const f = opt.fetchImpl || globalThis.fetch
  let u = String(url)
  if (opt.params && typeof opt.params === 'object') {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(opt.params)) p.append(k, v)
    const s = p.toString()
    if (s) u += (u.includes('?') ? '&' : '?') + s
  }
  const ctl = new AbortController()
  const timer = setTimeout(() => { try { ctl.abort() } catch {} }, opt.timeout || 120000)
  try {
    const res = await f(u, { headers: { 'User-Agent': UA, ...(opt.headers || {}) }, signal: ctl.signal })
    clearTimeout(timer)
    if (!res.ok) throw bikinAxiosError('Request failed with status code ' + res.status, res)
    const data = await bacaIsi(res, opt.responseType)
    return { data, status: res.status, statusText: res.statusText || '', headers: t(res.headers), config: opt }
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

export async function agPOST (url, data, opt = {}) {
  const f = opt.fetchImpl || globalThis.fetch
  let body = data
  let kepala = { 'User-Agent': UA, ...(opt.headers || {}) }
  if (data instanceof FormData) {
    Object.assign(kepala, data.getHeaders())
    body = data.toBuffer()
  } else if (data && typeof data === 'object' && !(data instanceof Uint8Array) && !(Buffer.isBuffer(data))) {
    if (!kepala['Content-Type'] && !kepala['content-type']) kepala['Content-Type'] = 'application/json'
    if (typeof body !== 'string') body = JSON.stringify(body)
  }
  const ctl = new AbortController()
  const timer = setTimeout(() => { try { ctl.abort() } catch {} }, opt.timeout || 120000)
  try {
    const res = await f(String(url), { method: 'POST', body, headers: kepala, signal: ctl.signal })
    clearTimeout(timer)
    if (!res.ok) throw bikinAxiosError('Request failed with status code ' + res.status, res)
    const isi = await bacaIsi(res, opt.responseType)
    return { data: isi, status: res.status, statusText: res.statusText || '', headers: t(res.headers), config: opt }
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

export async function agPut (url, data, opt = {}) {
  return agPOST(url, data, { ...opt, method: 'PUT' })
}

const axios = {
  get: agGET,
  post: agPOST,
  put: agPut,
  FormData,
  create: () => axios
}

export default axios
