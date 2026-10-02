FROM node:20-slim

WORKDIR /app

# ── Lewati SEMUA lifecycle script native (better-sqlite3, cpu-features, dll).
# Bot TIDAK memakai module native tersebut saat runtime (database pakai JSON),
# jadi build tidak butuh python/make/g++ dan tidak akan gagal di Railway/Termux.
ENV npm_config_ignore_scripts=true
ENV NPM_CONFIG_IGNORE_SCRIPTS=true

# .npmrc ikut di-copy SEBELUM install supaya ignore-scripts juga terbaca dari config file
COPY package.json package-lock.json* .npmrc ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
