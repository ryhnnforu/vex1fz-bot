/**
 * server.js — HTTP server untuk menyajikan game HTML minigame
 *   /games/dino.html, /games/flappy.html, /games/catur.html, /games/geometry.html
 *   /health → cek kesehatan (untuk panel)
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const config = require('./config')
const { log } = require('./lib/util')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

function startServer() {
  const server = http.createServer((req, res) => {
    try {
      const url = (req.url || '/').split('?')[0]

      if (url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ ok: true, bot: config.botName, ts: Date.now() }))
      }

      if (url === '/' || url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${config.botName} bot</title>
<style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0f14;color:#7CFCB1;font-family:ui-monospace,monospace}.c{text-align:center}h1{font-size:42px;margin:0}p{color:#8aa}</style></head>
<body><div class="c"><h1>${config.botName} ✅</h1><p>server game aktif — buka /games/dino.html</p></div></body></html>`)
      }

      if (url.startsWith('/games/')) {
        const file = path.basename(url) // aman dari path traversal
        const full = path.join(config.gamesDir, file)
        if (fs.existsSync(full) && full.startsWith(config.gamesDir)) {
          res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' })
          return res.end(fs.readFileSync(full))
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        return res.end('game tidak ditemukan')
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('not found')
    } catch (e) {
      res.writeHead(500)
      res.end('error')
    }
  })

  server.listen(config.port, '0.0.0.0', () => {
    log.ok(`server game aktif → port ${config.port}  (contoh: /games/dino.html)`)
  })
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') log.err(`port ${config.port} sudah dipakai — ganti PORT di .env`)
    else log.err('server error:', e.message)
  })
  return server
}

module.exports = { startServer }
