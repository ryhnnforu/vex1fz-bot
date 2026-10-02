FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
# --ignore-scripts: lewati build native (better-sqlite3 dll) yang bikin build gagal di Railway.
# sharp/ffmpeg tetap jalan karena binary-nya dari optional package (sudah diverifikasi).
RUN npm install --omit=dev --ignore-scripts

COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
