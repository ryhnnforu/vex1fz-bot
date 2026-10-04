/**
 * ============================================================
 *  lib/htmlgames.js — GAME CANVAS SELF-CONTAINED UNTUK HTML-APP
 * ------------------------------------------------------------
 *  Semua game di sini SATU file HTML mandiri: CSS inline, SVG
 *  inline, WebAudio (tanpa file suara), localStorage best score.
 *  Tidak ada resource eksternal -> aman di webview WhatsApp.
 *
 *  Arsitektur meniru gdmini: kartu neon + header skor/best +
 *  progress bar + canvas + status + watermark, game loop via
 *  requestAnimationFrame, input tap/touch/keyboard.
 * ============================================================
 */

const GD_RAW = `<style>
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; }
body { margin: 0; background: transparent; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #eee; touch-action: manipulation; cursor: pointer; }
.gd-wrap { width: 100%; max-width: 640px; margin: auto; padding: 12px; }
.gd-card { background: rgba(15, 18, 28, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0, 243, 255, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 243, 255, 0.15), 0 0 15px rgba(157, 78, 221, 0.2); }
.gd-header { padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(0,243,255,0.05), rgba(157,78,221,0.05)); }
.gd-sub { font-size: 10px; letter-spacing: 2px; color: #00f3ff; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px; }
.gd-title { font-size: 20px; font-weight: 900; color: #fff; text-shadow: 0 0 10px rgba(0, 243, 255, 0.6); letter-spacing: 1px; }
.gd-stats { text-align: right; display: flex; align-items: center; gap: 14px; }
.gd-score { font-size: 20px; font-weight: 900; color: #00f3ff; text-shadow: 0 0 12px rgba(0, 243, 255, 0.8); transition: transform 0.15s ease-out; }
.gd-best { font-size: 10px; color: rgba(255, 255, 255, 0.5); font-weight: 600; margin-top: 1px; display: flex; align-items: center; justify-content: flex-end; gap: 3px; }
.gd-audio-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; padding: 0; }
.gd-audio-btn:active { transform: scale(0.9); }
.gd-body { padding: 14px; position: relative; }
.gd-progress-wrap { width: 100%; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; margin-bottom: 10px; overflow: hidden; position: relative; }
.gd-progress-bar { width: 0%; height: 100%; background: linear-gradient(90deg, #00f3ff, #9d4edd); border-radius: 3px; box-shadow: 0 0 8px #00f3ff; transition: width 0.1s linear; }
canvas#game { width: 100%; height: auto; background: #080b12; border: 1px solid rgba(0, 243, 255, 0.2); border-radius: 12px; display: block; box-shadow: inset 0 0 20px rgba(0,0,0,0.8); }
.gd-status { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: rgba(255, 255, 255, 0.6); font-weight: 600; }
.svg-icon { display: inline-block; vertical-align: middle; }
</style>

<div class="gd-wrap">
  <div class="gd-card">
    <div class="gd-header">
      <div>
        <div class="gd-sub">
          <svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00f3ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 12h4m-2-2v4"></path><circle cx="17" cy="10" r="1" fill="#00f3ff"></circle><circle cx="15" cy="13" r="1" fill="#00f3ff"></circle></svg>
          HIRARA ARCADE
        </div>
        <div class="gd-title">Geometry Dash Mini</div>
      </div>
      <div class="gd-stats">
        <button id="soundToggle" class="gd-audio-btn" title="Toggle Sound">
          <svg id="iconAudioOn" class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f3ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <svg id="iconAudioOff" class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
        </button>
        <div>
          <div id="score" class="gd-score">0000</div>
          <div id="best" class="gd-best">
            <svg class="svg-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>
            <span id="bestText">BEST 0000</span>
          </div>
        </div>
      </div>
    </div>
    <div class="gd-body">
      <div class="gd-progress-wrap"><div id="progressBar" class="gd-progress-bar"></div></div>
      <canvas id="game" width="640" height="360"></canvas>
      <div class="gd-status">
        <span id="levelStatus">Level 1</span>
        <span id="speedStatus">Speed 5.2x</span>
      </div>
      <div style="font-size: 10px; color: rgba(0, 243, 255, 0.5); text-align: center; margin-top: 6px; font-weight: 600; letter-spacing: 1px;">WM: Mommy Kyuu</div>
    </div>
  </div>
</div>

<script>
(function() {
  const c = document.getElementById('game');
  const ctx = c.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestTextEl = document.getElementById('bestText');
  const progressBar = document.getElementById('progressBar');
  const levelStatus = document.getElementById('levelStatus');
  const speedStatus = document.getElementById('speedStatus');
  const soundBtn = document.getElementById('soundToggle');
  const iconAudioOn = document.getElementById('iconAudioOn');
  const iconAudioOff = document.getElementById('iconAudioOff');

  const GY = 290;
  const P_SIZE = 28;

  let audioCtx = null;
  let soundMuted = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  soundBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    soundMuted = !soundMuted;
    if (soundMuted) {
      iconAudioOn.style.display = 'none';
      iconAudioOff.style.display = 'inline-block';
    } else {
      iconAudioOn.style.display = 'inline-block';
      iconAudioOff.style.display = 'none';
    }
  });

  function playSound(type) {
    if (soundMuted) return;
    initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      if (type === 'jump') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'double_jump') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.14);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'crash') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'level') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.08);
        osc.frequency.setValueAtTime(783, now + 0.16);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch(err) {}
  }

  function loadBest() {
    let vals = [];
    try { let v = localStorage.getItem('gd_best'); if (v) vals.push(parseInt(v, 10)); } catch(e){}
    try { let v = sessionStorage.getItem('gd_best'); if (v) vals.push(parseInt(v, 10)); } catch(e){}
    try { let m = document.cookie.match(/(?:^|;\\s*)gd_best=(\\d+)/); if (m) vals.push(parseInt(m[1], 10)); } catch(e){}
    return vals.length ? Math.max(...vals.filter(v => !isNaN(v))) : 0;
  }

  function saveBest(val) {
    let s = String(Math.floor(val));
    try { localStorage.setItem('gd_best', s); } catch(e){}
    try { sessionStorage.setItem('gd_best', s); } catch(e){}
    try { document.cookie = 'gd_best=' + s + ';max-age=31536000;path=/'; } catch(e){}
    try {
      let rq = indexedDB.open('gd_db', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
      rq.onsuccess = () => { try { rq.result.transaction('kv', 'readwrite').objectStore('kv').put(s, 'gd_best'); } catch(e){} };
    } catch(e){}
  }

  function loadBestAsync(cb) {
    try {
      let rq = indexedDB.open('gd_db', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
      rq.onsuccess = () => {
        try {
          let gr = rq.result.transaction('kv', 'readonly').objectStore('kv').get('gd_best');
          gr.onsuccess = () => { if (gr.result) cb(parseInt(gr.result, 10)); };
        } catch(e){}
      };
    } catch(e){}
  }

let bestScore = loadBest();
  loadBestAsync(v => {
    if (!isNaN(v) && v > bestScore) {
      bestScore = v;
      bestTextEl.textContent = 'BEST ' + String(Math.floor(bestScore)).padStart(4, '0');
    }
  });

  const STATE_PLAYING = 1;
  const STATE_GAMEOVER = 2;

  let gameState = STATE_PLAYING;
  let player, obstacles, particles, trail, bgStars;
  let score, speed, level, levelProgress;
  let spawnTimer, lastTime, shake, flash, runTime;
  let accentColor = '#00f3ff';
  let secondaryColor = '#9d4edd';

  const themeColors = [
    { primary: '#00f3ff', secondary: '#9d4edd' },
    { primary: '#ff007f', secondary: '#ffb703' },
    { primary: '#00ff87', secondary: '#60efff' },
    { primary: '#ff5e00', secondary: '#ff0055' }
  ];

  function resetGame() {
    player = {
      x: 90,
      y: GY - P_SIZE,
      w: P_SIZE,
      h: P_SIZE,
      vy: 0,
      rotation: 0,
      isGrounded: true,
      jumpCount: 0,
      maxJumps: 2
    };
    obstacles = [];
    particles = [];
    trail = [];
    bgStars = [];
    for (let i = 0; i < 28; i++) {
      bgStars.push({
        x: Math.random() * c.width,
        y: Math.random() * (GY - 30),
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.4 + 0.1,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
    score = 0;
    speed = 5.2;
    level = 1;
    levelProgress = 0;
    spawnTimer = 35;
    lastTime = 0;
    shake = 0;
    flash = 0;
    runTime = 0;

    let theme = themeColors[0];
    accentColor = theme.primary;
    secondaryColor = theme.secondary;

    scoreEl.textContent = '0000';
    bestTextEl.textContent = 'BEST ' + String(Math.floor(bestScore)).padStart(4, '0');
    speedStatus.textContent = 'Speed 5.2x';
    levelStatus.textContent = 'Level 1';
    progressBar.style.width = '0%';
  }

  function addBurst(x, y, count, color, maxSpd) {
    for (let i = 0; i < count; i++) {
      let angle = Math.random() * Math.PI * 2;
      let spd = (Math.random() * 0.8 + 0.2) * maxSpd;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 0.5,
        life: 1.0,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  }

  function triggerJump() {
    initAudio();
    if (gameState === STATE_GAMEOVER) {
      resetGame();
      gameState = STATE_PLAYING;
      performJump();
      return;
    }

    if (gameState === STATE_PLAYING) {
      performJump();
    }
  }

  function performJump() {
    if (player.jumpCount < player.maxJumps) {
      player.vy = -11.5;
      player.isGrounded = false;
      player.jumpCount++;

      if (player.jumpCount === 1) {
        playSound('jump');
        addBurst(player.x + P_SIZE/2, player.y + P_SIZE, 8, accentColor, 4);
      } else {
        playSound('double_jump');
        addBurst(player.x + P_SIZE/2, player.y + P_SIZE/2, 14, '#ffffff', 5);
        addBurst(player.x + P_SIZE/2, player.y + P_SIZE/2, 10, secondaryColor, 4.5);
      }
    }
  }

  function spawnObstacles() {
    let rand = Math.random();
    let startX = c.width + 20;

    if (rand < 0.25) {
      obstacles.push({ type: 'spike', x: startX, y: GY - 28, w: 24, h: 28 });
      if (Math.random() < 0.5) {
        obstacles.push({ type: 'spike', x: startX + 24, y: GY - 28, w: 24, h: 28 });
      }
    } else if (rand < 0.45) {
      let h1 = 32, h2 = 64;
      obstacles.push({ type: 'block', x: startX, y: GY - h1, w: 48, h: h1 });
      obstacles.push({ type: 'block', x: startX + 58, y: GY - h2, w: 48, h: h2 });
      if (level >= 2) {
        obstacles.push({ type: 'spike', x: startX + 70, y: GY - h2 - 24, w: 24, h: 24 });
      }
    } else if (rand < 0.65) {
      obstacles.push({ type: 'spike', x: startX + 20, y: GY - 28, w: 24, h: 28 });
      obstacles.push({ type: 'block', x: startX + 70, y: GY - 75, w: 64, h: 24 });
      obstacles.push({ type: 'spike', x: startX + 90, y: GY - 99, w: 24, h: 24 });
    } else if (rand < 0.82) {
      obstacles.push({ type: 'block', x: startX, y: GY - 32, w: 40, h: 32 });
      obstacles.push({ type: 'spike_down', x: startX + 60, y: GY - 130, w: 26, h: 30 });
      obstacles.push({ type: 'block', x: startX + 110, y: GY - 32, w: 40, h: 32 });
    } else {
      obstacles.push({ type: 'spike', x: startX, y: GY - 28, w: 24, h: 28 });
      obstacles.push({ type: 'block', x: startX + 45, y: GY - 60, w: 50, h: 24 });
      obstacles.push({ type: 'spike', x: startX + 110, y: GY - 28, w: 24, h: 28 });
    }
  }

  function checkCollision(p, obs) {
    let px = p.x + 3, py = p.y + 3, pw = p.w - 6, ph = p.h - 6;

    if (obs.type === 'spike' || obs.type === 'spike_down') {
      return (px < obs.x + obs.w && px + pw > obs.x && py < obs.y + obs.h && py + ph > obs.y);
    } else if (obs.type === 'block') {
      return (px < obs.x + obs.w && px + pw > obs.x && py < obs.y + obs.h && py + ph > obs.y);
    }
    return false;
  }

  function update(dt) {
    runTime += dt;

    if (gameState === STATE_PLAYING) {
      player.vy += 0.72 * dt;
      player.y += player.vy * dt;

      if (!player.isGrounded) {
        player.rotation += 0.22 * dt;
        trail.push({ x: player.x, y: player.y, rotation: player.rotation });
        if (trail.length > 6) trail.shift();
      } else {
        trail.length = 0;
        let snap = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
        player.rotation += (snap - player.rotation) * 0.35 * dt;
      }

      if (player.y >= GY - P_SIZE) {
        if (!player.isGrounded) {
          addBurst(player.x + P_SIZE/2, GY, 5, '#ffffff', 2);
        }
        player.y = GY - P_SIZE;
        player.vy = 0;
        player.isGrounded = true;
        player.jumpCount = 0;
      }

      obstacles.forEach(obs => {
        if (obs.type === 'block') {
          let pBottom = player.y + player.h;
          let pPrevBottom = pBottom - player.vy * dt;
          if (player.x + player.w - 6 > obs.x && player.x + 6 < obs.x + obs.w) {
            if (pPrevBottom <= obs.y + 8 && pBottom >= obs.y && player.vy >= 0) {
              player.y = obs.y - player.h;
              player.vy = 0;
              player.isGrounded = true;
              player.jumpCount = 0;
            }
          }
        }
      });

      bgStars.forEach(s => {
        s.x -= s.speed * speed * 0.25 * dt;
        if (s.x < 0) s.x = c.width;
      });

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnObstacles();
        let minGap = Math.max(45, 85 - speed * 3.5);
        spawnTimer = minGap + Math.random() * 30;
      }

      obstacles.forEach(obs => obs.x -= speed * dt);
      obstacles = obstacles.filter(obs => obs.x > -120);

      particles.forEach(pt => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 0.2 * dt;
        pt.life -= 0.035 * dt;
      });
      particles = particles.filter(pt => pt.life > 0);

      speed = Math.min(11.0, speed + 0.0016 * dt);
      score += dt * 0.7;

      levelProgress = (score % 250) / 250;
      let newLevel = Math.floor(score / 250) + 1;
      if (newLevel !== level) {
        level = newLevel;
        playSound('level');
        flash = 0.8;
        let theme = themeColors[(level - 1) % themeColors.length];
        accentColor = theme.primary;
        secondaryColor = theme.secondary;
      }

      progressBar.style.width = Math.min(100, (levelProgress * 100)).toFixed(1) + '%';
      levelStatus.textContent = 'Level ' + level;
      speedStatus.textContent = 'Speed ' + speed.toFixed(1) + 'x';

      if (score > bestScore) {
        bestScore = score;
        saveBest(bestScore);
      }

      scoreEl.textContent = String(Math.floor(score)).padStart(4, '0');
      bestTextEl.textContent = 'BEST ' + String(Math.floor(bestScore)).padStart(4, '0');

      for (const obs of obstacles) {
        if (checkCollision(player, obs)) {
          gameState = STATE_GAMEOVER;
          shake = 16;
          flash = 1.0;
          playSound('crash');
          addBurst(player.x + P_SIZE/2, player.y + P_SIZE/2, 28, accentColor, 6);
          addBurst(player.x + P_SIZE/2, player.y + P_SIZE/2, 20, '#ff0055', 5);
          break;
        }
      }
    }

    if (shake > 0) shake = Math.max(0, shake - 0.7 * dt);
    if (flash > 0) flash = Math.max(0, flash - 0.05 * dt);
  }

  function drawGrid() {
    ctx.strokeStyle = accentColor;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    let gridOffset = (runTime * speed * 2) % 24;

    ctx.beginPath();
    for (let x = -gridOffset; x < c.width; x += 24) {
      ctx.moveTo(x, GY);
      ctx.lineTo(x - 20, c.height);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let y = GY; y < c.height; y += 14) {
      ctx.moveTo(0, y);
      ctx.lineTo(c.width, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

function draw() {
    ctx.clearRect(0, 0, c.width, c.height);

    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    let bgGrad = ctx.createLinearGradient(0, 0, 0, c.height);
    bgGrad.addColorStop(0, '#060911');
    bgGrad.addColorStop(1, '#0e1322');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, c.width, c.height);

    bgStars.forEach(s => {
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = s.alpha * 0.5;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1.0;

    let groundGrad = ctx.createLinearGradient(0, GY, 0, c.height);
    groundGrad.addColorStop(0, 'rgba(15, 20, 35, 0.95)');
    groundGrad.addColorStop(1, 'rgba(5, 8, 15, 1)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GY, c.width, c.height - GY);

    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GY);
    ctx.lineTo(c.width, GY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    drawGrid();

    trail.forEach((t, idx) => {
      ctx.save();
      ctx.translate(t.x + P_SIZE/2, t.y + P_SIZE/2);
      ctx.rotate(t.rotation);
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.15 * (idx / trail.length);
      ctx.fillRect(-P_SIZE/2, -P_SIZE/2, P_SIZE, P_SIZE);
      ctx.restore();
    });

    if (gameState !== STATE_GAMEOVER) {
      ctx.save();
      ctx.translate(player.x + P_SIZE/2, player.y + P_SIZE/2);
      ctx.rotate(player.rotation);

      ctx.shadowColor = accentColor;
      ctx.shadowBlur = player.jumpCount === 2 ? 18 : 12;
      ctx.fillStyle = player.jumpCount === 2 ? '#ffffff' : accentColor;
      ctx.fillRect(-P_SIZE/2, -P_SIZE/2, P_SIZE, P_SIZE);

      ctx.fillStyle = '#060911';
      ctx.fillRect(-P_SIZE/2 + 4, -P_SIZE/2 + 4, P_SIZE - 8, P_SIZE - 8);

      ctx.fillStyle = secondaryColor;
      ctx.fillRect(-P_SIZE/2 + 8, -P_SIZE/2 + 8, P_SIZE - 16, P_SIZE - 16);

      ctx.restore();
    }

    obstacles.forEach(obs => {
      ctx.save();
      if (obs.type === 'spike') {
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.w / 2, obs.y);
        ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
        ctx.lineTo(obs.x, obs.y + obs.h);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (obs.type === 'spike_down') {
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y);
        ctx.lineTo(obs.x + obs.w, obs.y);
        ctx.lineTo(obs.x + obs.w / 2, obs.y + obs.h);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (obs.type === 'block') {
        ctx.shadowColor = secondaryColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obs.x + 2, obs.y + 2, obs.w - 4, obs.h - 4);
      }
      ctx.restore();
    });

    particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      ctx.restore();
    });

    if (flash > 0) {
      ctx.fillStyle = 'rgba(255, 0, 85, ' + (flash * 0.35) + ')';
      ctx.fillRect(0, 0, c.width, c.height);
    }

    ctx.restore();

    if (gameState === STATE_GAMEOVER) {
      ctx.fillStyle = 'rgba(6, 9, 17, 0.75)';
      ctx.fillRect(0, 0, c.width, c.height);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 18;
      ctx.font = '900 32px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ff0055';
      ctx.fillText('GAME OVER', c.width / 2, c.height / 2 - 25);

      ctx.shadowBlur = 0;
      ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('SCORE: ' + Math.floor(score), c.width / 2, c.height / 2 + 10);

      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillStyle = accentColor;
      ctx.fillText('TAP ATAU TEKAN SPACE UNTUK MAIN LAGI', c.width / 2, c.height / 2 + 42);
      ctx.restore();
    }
  }

  function gameLoop(time) {
    if (!lastTime) lastTime = time;
    let dt = Math.min((time - lastTime) / 16.67, 2.0);
    lastTime = time;

    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
  }

  function handleInput(e) {
    if (e.target && e.target.closest && e.target.closest('#soundToggle')) return;
    if (e.cancelable && e.type && e.type.startsWith('touch')) e.preventDefault();
    triggerJump();
  }

  c.addEventListener('touchstart', handleInput, { passive: false });
  c.addEventListener('mousedown', handleInput);

  window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      triggerJump();
    }
  });

  resetGame();
  requestAnimationFrame(gameLoop);
})();
</script>`

/* ---- D-pad untuk Geometry Dash Mini (disuntik ke payload port) ---- */
const GD_PAD_CSS = `
.pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 252px; margin: 12px auto 0; }
.pbtn { height: 50px; border-radius: 14px; border: 1px solid rgba(0,243,255,0.35); background: rgba(0,243,255,0.08); color: #00f3ff; font-size: 19px; font-weight: 900; line-height: 1; display: flex; align-items: center; justify-content: center; touch-action: none; cursor: pointer; text-shadow: 0 0 8px rgba(0,243,255,0.6); }
.pbtn.on { background: rgba(0,243,255,0.32); color: #fff; box-shadow: 0 0 16px rgba(0,243,255,0.55); }
.pbtn.act { border-color: rgba(157,78,221,0.55); background: rgba(157,78,221,0.16); color: #e0b3ff; text-shadow: 0 0 8px rgba(157,78,221,0.6); }
.pbtn.act.on { background: rgba(157,78,221,0.45); color: #fff; }
.pbtn.off { visibility: hidden; }
.padhint { text-align: center; font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 8px; font-weight: 700; letter-spacing: 0.3px; }
`

const GD_PAD_HTML =
  '      <div class="pad" id="pad">' +
    '<div class="pbtn off"></div><div class="pbtn" id="padUp">\u25B2</div><div class="pbtn off"></div>' +
    '<div class="pbtn" id="padLeft">\u25C0</div><div class="pbtn act" id="padAct">\u25CF</div><div class="pbtn" id="padRight">\u25B6</div>' +
    '<div class="pbtn off"></div><div class="pbtn" id="padDown">\u25BC</div><div class="pbtn off"></div>' +
  '</div>' +
  '      <div class="padhint">\u25B2 / \u25CF lompat  \u00B7  \u25BC jatuh cepat  \u00B7  \u25C0 lambat  \u00B7  \u25B6 ngebut</div>\n'

const GD_PAD_JS = `
  /* D-pad on-screen: kirim keydown/keyup + modifier gravitasi/kecepatan */
  window.__GDMOD = { grav: 1, spd: 1 };
  (function () {
    var hold = {};
    function apply () {
      window.__GDMOD.grav = hold.down ? 2.3 : 1;
      window.__GDMOD.spd = hold.left ? 0.78 : (hold.right ? 1.2 : 1);
    }
    function kirim (code, down) {
      var ev = null;
      try {
        if (typeof KeyboardEvent === 'function') ev = new KeyboardEvent(down ? 'keydown' : 'keyup', { code: code, key: code, bubbles: true, cancelable: true });
      } catch (e) { ev = null; }
      if (!ev) ev = { type: down ? 'keydown' : 'keyup', code: code, key: code, preventDefault: function () {}, stopPropagation: function () {} };
      try { window.dispatchEvent(ev); } catch (e2) {}
    }
    var MAP = { padUp: 'ArrowUp', padAct: 'Space', padDown: 'ArrowDown', padLeft: 'ArrowLeft', padRight: 'ArrowRight' };
    Object.keys(MAP).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || !el.addEventListener) return;
      var dir = id === 'padDown' ? 'down' : (id === 'padLeft' ? 'left' : (id === 'padRight' ? 'right' : null));
      var dn = function (e) { if (e && e.preventDefault) e.preventDefault(); if (dir) hold[dir] = true; apply(); if (el.classList) el.classList.add('on'); kirim(MAP[id], true); };
      var up = function (e) { if (e && e.preventDefault) e.preventDefault(); if (dir) hold[dir] = false; apply(); if (el.classList) el.classList.remove('on'); kirim(MAP[id], false); };
      el.addEventListener('touchstart', dn, { passive: false });
      el.addEventListener('touchend', up, { passive: false });
      el.addEventListener('touchcancel', up, { passive: false });
      el.addEventListener('mousedown', dn);
      el.addEventListener('mouseup', up);
      el.addEventListener('mouseleave', up);
    });
  })();
`

/** Geometry Dash Mini (port, direbrand) */
const GD_HOOK =
  '  window.__ARC = { get state () { return { x: player.x, y: player.y, vy: player.vy, ' +
  'jumps: player.jumpCount, maxJumps: player.maxJumps, over: gameState === STATE_GAMEOVER, ' +
  'score: score, speed: speed, level: level, obstacles: obstacles }; } };\n'

export function gdMiniHtml (brand = 'THERYHANN!') {
  return GD_RAW
    .replace('HIRARA ARCADE', String(brand).toUpperCase() + ' ARCADE')
    .replace('WM: Mommy Kyuu', 'WM: ' + brand)
    // ratio lebih besar (v7.2): 800x440
    .replace('<canvas id="game" width="640" height="360"></canvas>', '<canvas id="game" width="800" height="440"></canvas>')
    .replace('.gd-wrap { width: 100%; max-width: 640px;', '.gd-wrap { width: 100%; max-width: 680px;')
    .replace('const GY = 290;', 'const GY = c.height - 70;')
    // kontrol 4 arah: gravitasi & kecepatan bisa dimodifikasi D-pad
    .replace('player.vy += 0.72 * dt;', 'player.vy += 0.72 * (window.__GDMOD ? window.__GDMOD.grav : 1) * dt;')
    .replace('obstacles.forEach(obs => obs.x -= speed * dt);',
      'obstacles.forEach(obs => obs.x -= speed * (window.__GDMOD ? window.__GDMOD.spd : 1) * dt);')
    // D-pad (CSS + markup + wiring)
    .replace('.svg-icon { display: inline-block; vertical-align: middle; }',
      '.svg-icon { display: inline-block; vertical-align: middle; }' + GD_PAD_CSS)
    .replace('      <div style="font-size: 10px; color: rgba(0, 243, 255, 0.5); text-align: center;',
      GD_PAD_HTML + '      <div style="font-size: 10px; color: rgba(0, 243, 255, 0.5); text-align: center;')
    // hook state: dipakai smoke-test runtime, tidak mengubah gameplay
    .replace('  resetGame();\n  requestAnimationFrame(gameLoop);',
      GD_PAD_JS + GD_HOOK + '  resetGame();\n  requestAnimationFrame(gameLoop);')
}

/* ------------------------------------------------------------------ */
/*  SHELL BERSAMA (CSS + markup + prelude JS)                          */
/* ------------------------------------------------------------------ */

const CSS = `
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; }
body { margin: 0; background: transparent; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #eee; touch-action: manipulation; cursor: pointer; }
.gd-wrap { width: 100%; max-width: 640px; margin: auto; padding: 12px; }
.gd-card { background: rgba(15,18,28,0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0,243,255,0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,243,255,0.15), 0 0 15px rgba(157,78,221,0.2); }
.gd-header { padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(0,243,255,0.05), rgba(157,78,221,0.05)); }
.gd-sub { font-size: 10px; letter-spacing: 2px; color: #00f3ff; font-weight: 700; text-transform: uppercase; }
.gd-title { font-size: 20px; font-weight: 900; color: #fff; text-shadow: 0 0 10px rgba(0,243,255,0.6); letter-spacing: 1px; }
.gd-stats { text-align: right; }
.gd-score { font-size: 20px; font-weight: 900; color: #00f3ff; text-shadow: 0 0 12px rgba(0,243,255,0.8); }
.gd-best { font-size: 10px; color: rgba(255,255,255,0.5); font-weight: 600; margin-top: 1px; }
.gd-body { padding: 14px; position: relative; }
.gd-progress-wrap { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 10px; overflow: hidden; }
.gd-progress-bar { width: 0%; height: 100%; background: linear-gradient(90deg, #00f3ff, #9d4edd); border-radius: 3px; box-shadow: 0 0 8px #00f3ff; transition: width 0.1s linear; }
canvas#game { width: 100%; height: auto; background: #080b12; border: 1px solid rgba(0,243,255,0.2); border-radius: 12px; display: block; box-shadow: inset 0 0 20px rgba(0,0,0,0.8); }
.pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 252px; margin: 12px auto 0; }
.pbtn { height: 50px; border-radius: 14px; border: 1px solid rgba(0,243,255,0.35); background: rgba(0,243,255,0.08); color: #00f3ff; font-size: 19px; font-weight: 900; line-height: 1; display: flex; align-items: center; justify-content: center; touch-action: none; cursor: pointer; text-shadow: 0 0 8px rgba(0,243,255,0.6); }
.pbtn.on { background: rgba(0,243,255,0.32); color: #fff; box-shadow: 0 0 16px rgba(0,243,255,0.55); }
.pbtn.act { border-color: rgba(157,78,221,0.55); background: rgba(157,78,221,0.16); color: #e0b3ff; text-shadow: 0 0 8px rgba(157,78,221,0.6); }
.pbtn.act.on { background: rgba(157,78,221,0.45); color: #fff; }
.pbtn.off { visibility: hidden; }
.padhint { text-align: center; font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 8px; font-weight: 700; letter-spacing: 0.3px; }
.gd-status { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 600; }
.gd-wm { font-size: 10px; color: rgba(0,243,255,0.5); text-align: center; margin-top: 6px; font-weight: 600; letter-spacing: 1px; }
.gd-lb { margin-top: 9px; padding: 8px 10px; border: 1px dashed rgba(0,243,255,0.45); border-radius: 12px; background: rgba(0,243,255,0.07); text-align: center; }
.gd-lb-kode { font-size: 12px; font-weight: 800; color: #00f3ff; letter-spacing: 0.4px; }
.gd-lb-cmd { margin-top: 4px; font-size: 11.5px; font-weight: 700; color: #ffd166; -webkit-user-select: text; user-select: text; }
.gd-lb-judul { font-size: 9px; letter-spacing: 1.4px; color: rgba(255,255,255,0.45); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
`

/** markup kartu game: header + HUD + canvas (ratio per game) + D-pad (▲▼◀▶ + ●) */
/**
 * Grid D-pad sesuai konfigurasi game (v7.7).
 * o.pad = subset 'udlra'. Tombol tidak dipakai → 'off' (tak terlihat).
 * o.pad = '' → D-pad disembunyikan total.
 */
function tombolPad (id, glyph, kelas, pad) {
  const kode = { padUp: 'u', padDown: 'd', padLeft: 'l', padRight: 'r', padAct: 'a' }[id]
  const aktif = pad.indexOf(kode) >= 0
  /* v7.8.3: fix — sebelumnya '>' bocor jadi teks di tombol (▲>) */
  return aktif
    ? '<div class="pbtn' + (kelas ? ' ' + kelas : '') + '" id="' + id + '">' + glyph + '</div>'
    : '<div class="pbtn' + (kelas ? ' ' + kelas : '') + ' off"></div>'
}

function markupPad (o) {
  const pad = String(o.pad ?? 'udlra')
  if (!pad) return ''
  return '<div class="pad" id="pad">' +
    '<div class="pbtn off"></div>' + tombolPad('padUp', '\u25B2', '', pad) + '<div class="pbtn off"></div>' +
    tombolPad('padLeft', '\u25C0', '', pad) + tombolPad('padAct', '\u25CF', 'act', pad) + tombolPad('padRight', '\u25B6', '', pad) +
    '<div class="pbtn off"></div>' + tombolPad('padDown', '\u25BC', '', pad) + '<div class="pbtn off"></div>' +
    '</div>'
}

function markup (title, brand, o) {
  return '<div class="gd-wrap tema-' + (o.tema || temaGame(title, o.skin)) + '" style="max-width:' + o.maxw + 'px"><div class="gd-card"><div class="gd-header"><div>' +
    '<div class="gd-sub">' + String(brand).toUpperCase() + ' ' + (o.sub || 'ARCADE') + '</div>' +
    '<div class="gd-title">' + title + '</div></div>' +
    '<div class="gd-stats"><div id="score" class="gd-score">0000</div>' +
    '<div id="best" class="gd-best">BEST 0000</div></div></div>' +
    '<div class="gd-body"><div class="gd-progress-wrap"><div id="progressBar" class="gd-progress-bar"></div></div>' +
    '<canvas id="game" width="' + o.w + '" height="' + o.h + '"></canvas>' +
    '<div class="gd-status"><span id="levelStatus">Level 1</span><span id="speedStatus">Speed 1.0x</span></div>' +
    markupPad(o) +
    '<div class="padhint" id="padHint">' + (o.hint || '') + '</div>' +
    '<div class="gd-lb" id="lbBar" style="display:none"><span id="lbKode"></span><span id="lbCmd"></span></div>' +
    '<div class="gd-wm">WM: ' + brand + '</div></div></div></div>'
}

/** prelude JS: ref elemen, WebAudio, best-score, helper, wiring D-pad */
const PRELUDE = `
(function () {
  /* ---- v7.6: leaderboard (.lbgame) — data disuntik server saat kartu dikirim ---- */
  var __LB = { game: "", nonce: "", cmd: ".setorskore" };
  var c = document.getElementById('game');
  var ctx = c.getContext('2d');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var progressBar = document.getElementById('progressBar');
  var levelStatus = document.getElementById('levelStatus');
  var speedStatus = document.getElementById('speedStatus');
  var hintEl = document.getElementById('padHint');

  var audioCtx = null, muted = false;
  function initAudio () {
    if (!audioCtx) { var A = window.AudioContext || window.webkitAudioContext; if (A) audioCtx = new A(); }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  function beep (type, f0, f1, dur, vol, wave) {
    if (muted) return; initAudio(); if (!audioCtx) return;
    try {
      var now = audioCtx.currentTime;
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = wave || 'square';
      o.frequency.setValueAtTime(f0, now);
      o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + dur);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + dur);
    } catch (e) {}
  }
  var SFX = {
    point: function () { beep('p', 520, 880, 0.10, 0.12, 'square'); },
    jump: function () { beep('j', 220, 650, 0.12, 0.12, 'square'); },
    crash: function () { beep('c', 160, 40, 0.25, 0.25, 'sawtooth'); },
    level: function () { beep('l', 523, 784, 0.30, 0.15, 'sine'); }
  };

  function loadBest () {
    var vals = [];
    try { var a = localStorage.getItem('arc_best'); if (a) vals.push(parseInt(a, 10)); } catch (e) {}
    try { var b = sessionStorage.getItem('arc_best'); if (b) vals.push(parseInt(b, 10)); } catch (e) {}
    return vals.length ? Math.max.apply(null, vals.filter(function (v) { return !isNaN(v); })) : 0;
  }
  function saveBest (v) {
    var s = String(Math.floor(v));
    try { localStorage.setItem('arc_best', s); } catch (e) {}
    try { sessionStorage.setItem('arc_best', s); } catch (e) {}
  }
  var bestScore = loadBest();
  function pad4 (n) { return String(Math.floor(n)).padStart(4, '0'); }
  function setScore (n) { scoreEl.textContent = pad4(n); try { updateLb(); } catch (e) {} }
  function setBest () { bestEl.textContent = 'BEST ' + pad4(bestScore); }
  function setStatus (lv, sp) { levelStatus.textContent = lv; speedStatus.textContent = sp; }
  function setProgress (p) { progressBar.style.width = Math.min(100, Math.max(0, p * 100)).toFixed(1) + '%'; }
  function setHint (t) { if (hintEl) hintEl.textContent = t; }
  function rand (a, b) { return a + Math.random() * (b - a); }

  var THEMES = [
    { primary: '#00f3ff', secondary: '#9d4edd' },
    { primary: '#ff007f', secondary: '#ffb703' },
    { primary: '#00ff87', secondary: '#60efff' },
    { primary: '#ff5e00', secondary: '#ff0055' }
  ];
  function theme (i) { return THEMES[i % THEMES.length]; }

  /* ---- D-pad on-screen: ▲ ▼ ◀ ▶ + ● (dikirim sebagai keydown/keyup) ---- */
  var PAD_KODE = { padUp: 'ArrowUp', padDown: 'ArrowDown', padLeft: 'ArrowLeft', padRight: 'ArrowRight', padAct: 'Space' };
  var padAktif = {};
  function kirimKey (code, down) {
    var tipe = down ? 'keydown' : 'keyup', ev = null;
    try {
      if (typeof KeyboardEvent === 'function') ev = new KeyboardEvent(tipe, { code: code, key: code, bubbles: true, cancelable: true });
    } catch (e) { ev = null; }
    if (!ev) ev = { type: tipe, code: code, key: code, bubbles: true, preventDefault: function () {}, stopPropagation: function () {} };
    try { window.dispatchEvent(ev); } catch (e) {}
    try { if (c && c.dispatchEvent) c.dispatchEvent(ev); } catch (e2) {}
  }
  function tekanPad (code) { if (!padAktif[code]) { padAktif[code] = true; kirimKey(code, true); } }
  function lepasPad (code) { if (padAktif[code]) { padAktif[code] = false; kirimKey(code, false); } }
  Object.keys(PAD_KODE).forEach(function (id) {
    var el = document.getElementById(id);
    if (!el || !el.addEventListener) return;
    var code = PAD_KODE[id];
    var down = function (e) { if (e && e.preventDefault) e.preventDefault(); initAudio(); if (el.classList) el.classList.add('on'); tekanPad(code); };
    var up = function (e) { if (e && e.preventDefault) e.preventDefault(); if (el.classList) el.classList.remove('on'); lepasPad(code); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
  });
  try { window.addEventListener('blur', function () { Object.keys(padAktif).forEach(function (k) { lepasPad(k); }); }); } catch (e) {}

  /* ---- v7.6: kode setor skor (dihitung di kartu, divalidasi di server) ---- */
  var lbEl = document.getElementById('lbBar');
  var lbKodeEl = document.getElementById('lbKode');
  var lbCmdEl = document.getElementById('lbCmd');
  function hash36 (str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57, i, ch;
    for (i = 0; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).slice(0, 5);
  }
  function skorHud () {
    var t = String((scoreEl && scoreEl.textContent) || '').replace(/[^0-9]/g, '');
    return t ? parseInt(t, 10) : 0;
  }
  function buatKode (skor) {
    if (!__LB.nonce) return '';
    var n = Math.max(0, Math.floor(Number(skor) || 0));
    return n.toString(36) + '-' + hash36(__LB.nonce + ':' + __LB.game + ':' + n);
  }
  var lbTerakhir = '';
  function updateLb () {
    if (!lbEl) return;
    if (!__LB.nonce) { lbEl.style.display = 'none'; return; }
    var skor = skorHud();
    var kode = buatKode(skor);
    var baris = 'SKOR ' + skor + ' · KODE ' + kode;
    if (baris !== lbTerakhir) {
      lbTerakhir = baris;
      if (lbKodeEl) lbKodeEl.textContent = baris;
      if (lbCmdEl) lbCmdEl.textContent = (__LB.cmd || '.setorskore') + ' ' + kode;
    }
  }
  try { setInterval(function () { try { updateLb(); } catch (e) {} }, 600); } catch (e) {}
  updateLb();

  window.__ARC = { c: c, ctx: ctx, SFX: SFX, __LB: __LB, lbKode: buatKode, hash36: hash36, updateLb: updateLb, setScore: setScore, setBest: setBest, setStatus: setStatus, setProgress: setProgress, setHint: setHint, rand: rand, theme: theme, get best () { return bestScore; }, set best (v) { bestScore = v; }, saveBest: saveBest, initAudio: initAudio, pad4: pad4, press: tekanPad, release: lepasPad, W: c.width, H: c.height };
  setBest();
`

/**
 * shell(title, brand, gameJs, opts)
 * opts: { w, h }      = ukuran canvas (ratio tiap game beda-beda)
 *       { maxw }      = lebar maksimum kartu di layar
 *       { hint }      = teks petunjuk kontrol di bawah D-pad
 */

/* ------------------------------------------------------------------ */
/*  SKIN PASTEL / KAWAII (v7.5) — kelas sama persis dengan CSS neon,   */
/*  hanya warnanya yang beda. Dipakai lewat shell(..., {skin:'pastel'}) */
/* ------------------------------------------------------------------ */
const CSS_PASTEL = `
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; }
body { margin: 0; background: transparent; font-family: 'Comic Sans MS', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #6b5560; touch-action: manipulation; cursor: pointer; }
.gd-wrap { width: 100%; max-width: 640px; margin: auto; padding: 12px; }
.gd-card { background: #fffaf6; border: 3px solid #ffd7e4; border-radius: 26px; overflow: hidden; box-shadow: 0 10px 26px rgba(255,143,177,0.22); }
.gd-header { padding: 13px 18px; border-bottom: 3px dashed #ffe3ec; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, #fff0f5, #eefaf6); }
.gd-sub { font-size: 10px; letter-spacing: 2px; color: #ff8fb1; font-weight: 700; text-transform: uppercase; }
.gd-title { font-size: 20px; font-weight: 900; color: #7a5c6b; letter-spacing: 0.5px; }
.gd-stats { text-align: right; }
.gd-score { font-size: 20px; font-weight: 900; color: #ff7aa2; }
.gd-best { font-size: 10px; color: #b79aa8; font-weight: 700; margin-top: 1px; }
.gd-body { padding: 14px; position: relative; background: #fffaf6; }
.gd-progress-wrap { width: 100%; height: 9px; background: #ffe9f0; border-radius: 6px; margin-bottom: 10px; overflow: hidden; border: 1px solid #ffd7e4; }
.gd-progress-bar { width: 0%; height: 100%; background: linear-gradient(90deg, #ff9ec4, #8ee0c8); border-radius: 6px; transition: width 0.12s linear; }
canvas#game { width: 100%; height: auto; background: #fff7f2; border: 3px solid #ffe0ea; border-radius: 20px; display: block; }
.pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; max-width: 258px; margin: 13px auto 0; }
.pbtn { height: 52px; border-radius: 18px; border: 2px solid #ffc9da; background: #fff0f5; color: #ff7aa2; font-size: 19px; font-weight: 900; line-height: 1; display: flex; align-items: center; justify-content: center; touch-action: none; cursor: pointer; box-shadow: 0 3px 0 #ffd7e4; }
.pbtn.on { background: #ffd0e0; color: #fff; box-shadow: 0 1px 0 #ffc9da; transform: translateY(2px); }
.pbtn.act { border-color: #a8e6cf; background: #eafff7; color: #3fbb94; box-shadow: 0 3px 0 #c7f0e0; }
.pbtn.act.on { background: #8ee0c8; color: #fff; box-shadow: 0 1px 0 #a8e6cf; transform: translateY(2px); }
.pbtn.off { visibility: hidden; }
.padhint { text-align: center; font-size: 10px; color: #b79aa8; margin-top: 9px; font-weight: 700; letter-spacing: 0.2px; }
.gd-status { display: flex; justify-content: space-between; margin-top: 9px; font-size: 11px; color: #a98b9c; font-weight: 700; }
.gd-wm { font-size: 10px; color: #ffb3c9; text-align: center; margin-top: 7px; font-weight: 700; letter-spacing: 1px; }
.gd-lb { margin-top: 9px; padding: 8px 10px; border: 2px dashed #ffd7e4; border-radius: 16px; background: #fff0f5; text-align: center; }
.gd-lb-kode { font-size: 12px; font-weight: 900; color: #ff7aa2; letter-spacing: 0.4px; }
.gd-lb-cmd { margin-top: 4px; font-size: 11.5px; font-weight: 800; color: #3fbb94; -webkit-user-select: text; user-select: text; }
.gd-lb-judul { font-size: 9px; letter-spacing: 1.4px; color: #b79aa8; font-weight: 800; text-transform: uppercase; margin-bottom: 3px; }
`

/* ------------------------------------------------------------------ */
/*  v7.7 — D-PAD & PALET per game                                       */
/* ------------------------------------------------------------------ */
/*
 *  • pad      : string tombol yang TAMPIL (u/d/l/r/a) — default 'udlra'.
 *               '' = sembunyikan seluruh D-pad (game sentuh murni).
 *  • palette  : [utama, kedua] — warna aksen kartu per game.
 *               Diisi deterministik dari judul kalau tidak disebutkan,
 *               jadi SETIAP game tampil dengan warna berbeda satu sama lain.
 *  • KONFIG_GAME: override terpusat per judul (opts di callsite tetap menang).
 */
export const KONFIG_GAME = {
  /* ---------- palet & pad unik per game ---------- */
  /* Pong: ◀ ▶ memang tidak dipakai (keys.left/right disetel tapi tak pernah
     dibaca loop utama) → hanya ▲▼● yang tampil, selaras permainan (v7.7) */
  'Snake Neon': { palette: ['#00f3ff', '#ff0055'] },
  'Flappy Neon': { palette: ['#fbbf24', '#fb7185'] },
  'Breakout Neon': { palette: ['#a78bfa', '#38bdf8'] },
  'Space Shooter': { palette: ['#f87171', '#fbbf24'] },
  'Dino Run': { palette: ['#a3e635', '#22d3ee'] },
  'Pong Neon': { pad: 'uda', palette: ['#38bdf8', '#f472b6'] },
  'Neon Jump': { palette: ['#4ade80', '#facc15'] },
  'Frogger Neon': { palette: ['#34d399', '#fbbf24'] },
  'Maze Neon': { palette: ['#60a5fa', '#a3e635'] },
  'Neon Racer': { palette: ['#fb7185', '#38bdf8'] },
  'Tank Neon': { palette: ['#84cc16', '#eab308'] },
  'Neon Hunt': { palette: ['#f97316', '#0ea5e9'] },
  /* v7.37.0: Guitar Flash — ritme 4 lajur, lajur dipukul lewat tap/DFJK,
     D-pad ▲▼ pilih lagu · ◀▶ tingkat kesulitan · ● mulai + STAR POWER */
  'Guitar Flash': { palette: ['#f43f5e', '#ffd60a'], pad: 'udlra' },
  'Akinator Neon': { palette: ['#c084fc', '#f0abfc'] },
  'Block Blast Neon': { pad: '', palette: ['#f5455c', '#22d3ee'] }, /* v7.7.3: tap-tray, tanpa D-pad */
  'Catur Neon': { pad: '', palette: ['#e2e8f0', '#38bdf8'] }, /* v7.7.1: catur tap-only */
  'Minesweeper Neon': { palette: ['#facc15', '#94a3b8'] },
  'Asteroids Neon': { palette: ['#94a3b8', '#38bdf8'] },
  'Casino Slot (Chip)': { palette: ['#fde047', '#f472b6'] },
  'Poker 5-Card Draw': { palette: ['#34d399', '#fbbf24'] },
  'Crash / Aviator': { palette: ['#f87171', '#facc15'] },
  Baccarat: { palette: ['#f43f5e', '#60a5fa'] },
  'Pou Jump Retro': { palette: ['#fdba74', '#a78bfa'] },
  'Snake Nokia 3310': { palette: ['#9acd32', '#4d7c0f'] },
  'Space Invader Retro': { palette: ['#4ade80', '#f8fafc'] },
  'Papan Peringkat': { pad: '', palette: ['#fbbf24', '#f59e0b'] }, /* v7.7.1: BUKAN game — D-pad disembunyikan */
  'Missile Command': { palette: ['#f87171', '#facc15'] },
  'Lukis Neon': { palette: ['#c084fc', '#22d3ee'] },
  'Lunar Lander': { palette: ['#94a3b8', '#fbbf24'] },
  'Spiral Neon': { palette: ['#f472b6', '#22d3ee'] },
  'Bomber Neon': { palette: ['#fb923c', '#94a3b8'] },
  /* pastel & lainnya */
  'Permen Pastel': { palette: ['#ff8fb1', '#8ee0c8'] },
  'Susun Kata': { palette: ['#a78bfa', '#fda4af'] },
  'Balon Sabun': { palette: ['#7dd3fc', '#f9a8d4'] },
  'Pinball Pastel': { palette: ['#fca5a5', '#93c5fd'] },
  'Tikus Tanah': { palette: ['#fbbf24', '#fb923c'] },
  'Pipa Bocor': { palette: ['#6ee7b7', '#67e8f9'] },
  'Pancing Ikan': { palette: ['#38bdf8', '#34d399'] },
  'Irama Pastel': { palette: ['#f9a8d4', '#c4b5fd'] },
  'Kartu Memori': { palette: ['#fda4af', '#86efac'] },
  'Donat Susun': { palette: ['#f9a8d4', '#fde68a'] },
  'Slot Mesin RPG': { palette: ['#fde047', '#fb923c'] },
  'Rolet RPG': { palette: ['#f87171', '#34d399'] },
  'Dadu RPG': { palette: ['#e2e8f0', '#f87171'] },
  'Aviator RPG': { palette: ['#fb923c', '#ef4444'] },
  'Keno RPG': { palette: ['#60a5fa', '#fbbf24'] },
  'Blackjack RPG': { palette: ['#4ade80', '#f8fafc'] },
  'Spotify Player': { pad: '', palette: ['#1db954', '#1ed760'] }, /* v7.7.1: kartu pemutar, BUKAN game — TANPA D-pad */
  '2048': { pad: 'udlra', palette: ['#edc22e', '#f2b179'], padStyle: 'neon' }, /* v7.7.3: puzzle klasik */
  'Fruit Ninja': { pad: 'udlra', palette: ['#a3e635', '#22d3ee'] }, /* v7.8.0: slice emoji, tap/D-pad */
  'Tetris Neon': { palette: ['#22d3ee', '#c084fc'] }, /* v7.7.3: tetris klasik rupa asli */
  /* v7.8.3 — game rupa asli, pad disesuaikan tiap game */
  'Flappy Bird': { pad: 'a', palette: ['#f8b733', '#73bf2e'], padStyle: 'flappy' },
  'Pac-Man': { pad: 'udlr', palette: ['#ffe600', '#2121de'], padStyle: 'pacman' },
  'Subway Surf': { pad: 'udlra', palette: ['#ff7a00', '#0288d1'], padStyle: 'subway' },
  /* v7.9.0 — batch 2 rupa asli */
  'Candy Crush': { pad: 'udlra', palette: ['#ff4fa3', '#ffd54f'], padStyle: 'candy' },
  'Temple Run': { pad: 'udlra', palette: ['#ffb300', '#6d4c41'], padStyle: 'temple' },
  'Angry Birds': { pad: 'udlra', palette: ['#e53935', '#7cb342'], padStyle: 'angry' },
  'Super Jump': { pad: 'udlra', palette: ['#e52521', '#5c94fc'], padStyle: 'mario' },
  'Kartu Member': { pad: '', palette: ['#38bdf8', '#a78bfa'] }
}

/** daftar warna cadangan untuk judul yang belum punya palet eksplisit */
const PALET_CADANGAN = [
  '#00f3ff', '#ff0055', '#a78bfa', '#38bdf8', '#f87171', '#fbbf24',
  '#a3e635', '#22d3ee', '#f472b6', '#818cf8', '#4ade80', '#facc15',
  '#34d399', '#60a5fa', '#fb7185', '#84cc16', '#f97316', '#c084fc',
  '#0ea5e9', '#fda4af', '#7dd3fc', '#86efac', '#fde047', '#fb923c'
]

function hashJudul (t) {
  let h = 0
  for (const ch of String(t)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

/** palet deterministik dari judul (pastel: sedikit digeser supaya beda tema) */
export function paletGame (title, skin = 'neon') {
  const cfg = KONFIG_GAME[title]
  if (cfg?.palette) return cfg.palette
  const h = hashJudul(title)
  const i = h % PALET_CADANGAN.length
  const j = (i + 7 + (h % 5) + (skin === 'pastel' ? 3 : 0)) % PALET_CADANGAN.length
  return [PALET_CADANGAN[i], PALET_CADANGAN[j]]
}

/** normalisasi palette: string / array / object → [a, b] */
function normalPal (p, judul, skin) {
  if (Array.isArray(p) && p[0]) return [p[0], p[1] || p[0]]
  if (typeof p === 'string' && p) return [p, p]
  if (p && (p.a || p.b)) return [p.a || p.b, p.b || p.a]
  return paletGame(judul, skin)
}

/** hex '#rrggbb' + alfa '44' → '#rrggbb44' (aman utk input pendek) */
function alfa (hex, a) {
  const h = String(hex || '').trim()
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h + a : h
}

/** CSS override warna kartu sesuai palet game (kelas sama utk neon & pastel) */
function cssPale (pal) {
  const [a, b] = pal
  return '\n/* palet per game (v7.7) */\n' +
    '.gd-card { border-color: ' + alfa(a, '55') + ' !important; box-shadow: 0 8px 32px ' + alfa(a, '26') + ', 0 0 15px ' + alfa(b, '22') + ' !important; }\n' +
    '.gd-header { border-bottom-color: ' + alfa(a, '33') + ' !important; background: linear-gradient(90deg, ' + alfa(a, '14') + ', ' + alfa(b, '14') + ') !important; }\n' +
    '.gd-title { color: ' + a + ' !important; }\n' +
    '.gd-sub { color: ' + alfa(b, 'cc') + ' !important; }\n' +
    '.gd-score { color: ' + b + ' !important; }\n' +
    'canvas#game { border-color: ' + alfa(a, '44') + ' !important; }\n' +
    '.gd-progress-bar { background: linear-gradient(90deg, ' + a + ', ' + b + ') !important; }\n' +
    '.pbtn { border-color: ' + alfa(a, '66') + ' !important; color: ' + a + ' !important; background: ' + alfa(a, '12') + ' !important; text-shadow: 0 0 8px ' + alfa(a, '99') + ' !important; }\n' +
    '.pbtn.on { background: ' + a + ' !important; color: #ffffff !important; }\n' +
    '.pbtn.act { border-color: ' + alfa(b, 'aa') + ' !important; color: ' + b + ' !important; background: ' + alfa(b, '12') + ' !important; text-shadow: 0 0 8px ' + alfa(b, '99') + ' !important; }\n' +
    '.pbtn.act.on { background: ' + b + ' !important; color: #ffffff !important; }\n' +
    '.gd-lb-kode { color: ' + a + ' !important; }\n' +
    '.gd-lb-cmd { color: ' + b + ' !important; }\n' +
    '.gd-lb { border-color: ' + alfa(a, '44') + ' !important; background: ' + alfa(a, '0d') + ' !important; }\n' +
    '.gd-wm { color: ' + alfa(a, '88') + ' !important; }\n' +
    '.gd-status { color: ' + alfa(a, 'aa') + ' !important; }\n'
}


/* ------------------------------------------------------------------ */
/*  v7.9.1 — LAYAR PENUH + TEMA UNIK PER GAME (tanpa bar setor skor)   */
/* ------------------------------------------------------------------ */
/* Layar penuh: kartu memenuhi viewport, canvas melar ke ruang tersisa,
   D-pad melayang tembus pandang di bawah. Header ramping. */
const CSS_FULL = `
/* v7.9.2: kembali ke layout kartu v7.9.0 (stabil di semua client), hanya bar setor skor dihapus
   + kartu melebar penuh (tanpa margin) supaya terasa layar penuh */
.gd-wrap { max-width: none !important; width: 100%; padding: 0 !important; margin: 0 !important; }
.gd-card { border-radius: 0 !important; border-left-width: 0 !important; border-right-width: 0 !important; }
.gd-body { padding: 10px 10px 12px !important; }
canvas#game { width: 100% !important; height: auto !important; display: block; }
.pbtn { height: 52px !important; font-size: 21px !important; }
.pad { gap: 10px !important; max-width: 236px !important; margin-top: 10px !important; }
.gd-lb { display: none !important; }
`

/** genre tema dari judul: tiap game beda "nuansa", bukan cuma warna */
export function temaGame (title, skin = 'neon') {
  const t = String(title || '')
  if (skin === 'pastel' || /pastel|permen|donat|balon|kartu memori|susun kata|irama|tikus|pipa|pancing/i.test(t)) return 'pastel'
  if (/candy/i.test(t)) return 'candy'
  if (/3310|retro|invader|pou jump|missile|lunar|asteroid/i.test(t)) return 'retro'
  if (/casino|rolet|dadu|aviator|keno|blackjack|slot|baccarat|poker|crash/i.test(t)) return 'kasino'
  if (/temple|angry/i.test(t)) return 'jungle'
  if (/subway|racer|dino|frogger/i.test(t)) return 'city'
  if (/flappy|super jump|pac-man|tetris|2048|block blast|fruit/i.test(t)) return 'pixel'
  if (/catur|minesweeper|maze|akinator|papan|kartu member|spotify|lukis/i.test(t)) return 'glass'
  if (/space|shooter|tank|hunt|bomber|spiral|lander|pong|breakout|snake|jump|neon/i.test(t)) return 'neon'
  return 'neon'
}

function cssTema (tema, a, b) {
  const T = {
    /* NEON: hitam pekat, grid perspektif, teks bercahaya, tombol berpendar */
    neon: `
.tema-neon .gd-card { background: radial-gradient(ellipse at 50% 0%, ${alfa(a, '22')} 0%, #05060c 55%), repeating-linear-gradient(0deg, transparent 0 38px, ${alfa(a, '10')} 38px 39px), repeating-linear-gradient(90deg, transparent 0 38px, ${alfa(b, '10')} 38px 39px), #05060c; }
.tema-neon .gd-title { text-shadow: 0 0 6px ${a}, 0 0 18px ${alfa(a, '99')}, 0 0 40px ${alfa(b, '66')} !important; letter-spacing: 2px !important; text-transform: uppercase; }
.tema-neon .gd-score { text-shadow: 0 0 10px ${b}, 0 0 24px ${alfa(b, '88')} !important; font-family: 'Courier New', monospace; }
.tema-neon canvas#game { box-shadow: 0 0 0 1px ${alfa(a, '55')}, 0 0 24px ${alfa(a, '44')}, inset 0 0 40px rgba(0,0,0,.9) !important; }
.tema-neon .pbtn { box-shadow: 0 0 10px ${alfa(a, '55')}, inset 0 0 8px ${alfa(a, '22')} !important; border-radius: 50% !important; }
.tema-neon .pbtn.act { box-shadow: 0 0 12px ${alfa(b, '66')} !important; }
.tema-neon .gd-header { border-bottom: 1px solid ${alfa(a, '66')} !important; box-shadow: 0 1px 12px ${alfa(a, '33')}; }`,
    /* RETRO: layar CRT hijau/amber, scanline, font monospace, sudut kotak */
    retro: `
.tema-retro .gd-card { background: #0b0f0a; }
.tema-retro .gd-card::after { content: ''; position: fixed; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 4px); mix-blend-mode: multiply; }
.tema-retro .gd-header, .tema-retro .gd-status, .tema-retro .gd-title, .tema-retro .gd-score, .tema-retro .gd-sub, .tema-retro .gd-best, .tema-retro .padhint { font-family: 'Courier New', 'Lucida Console', monospace !important; }
.tema-retro .gd-title { text-transform: uppercase; letter-spacing: 3px !important; }
.tema-retro .gd-title::before { content: '> '; }
.tema-retro canvas#game { border-radius: 4px !important; border: 3px solid ${alfa(a, '88')} !important; box-shadow: inset 0 0 60px rgba(0,0,0,.8), 0 0 0 6px #1a1f17 !important; }
.tema-retro .gd-header { background: #131a12 !important; border-bottom: 3px double ${alfa(a, '88')} !important; }
.tema-retro .pbtn { border-radius: 6px !important; border: 3px solid ${alfa(a, 'aa')} !important; box-shadow: 0 4px 0 #1a1f17 !important; font-family: monospace !important; }
.tema-retro .pbtn.on { transform: translateY(3px); box-shadow: 0 1px 0 #1a1f17 !important; }`,
    /* KASINO: beludru merah/hijau, emas, pola berlian, tombol chip */
    kasino: `
.tema-kasino .gd-card { background: radial-gradient(ellipse at 50% 20%, #1d3b2a 0%, #0b1a12 70%), #0b1a12; }
.tema-kasino .gd-header { background: linear-gradient(180deg, #2a1a08, #150c03) !important; border-bottom: 2px solid #d4af37 !important; }
.tema-kasino .gd-title { color: #f6d365 !important; font-family: Georgia, 'Times New Roman', serif !important; letter-spacing: 1px !important; text-shadow: 0 1px 0 #7a5a12, 0 0 14px rgba(246,211,101,.5) !important; }
.tema-kasino .gd-sub { color: #d4af37 !important; }
.tema-kasino .gd-score { color: #fff3c4 !important; font-family: Georgia, serif !important; }
.tema-kasino canvas#game { border: 3px solid #d4af37 !important; box-shadow: 0 0 0 6px #4a2f0b, 0 0 0 8px #d4af37, 0 12px 30px rgba(0,0,0,.6) !important; border-radius: 18px !important; }
.tema-kasino .pbtn { border-radius: 50% !important; background: repeating-conic-gradient(#b91c1c 0 30deg, #fff 30deg 60deg) !important; border: 4px solid #fde68a !important; color: #111 !important; text-shadow: none !important; box-shadow: 0 4px 0 #7f1d1d, 0 6px 12px rgba(0,0,0,.5) !important; }
.tema-kasino .pbtn.act { background: repeating-conic-gradient(#065f46 0 30deg, #fff 30deg 60deg) !important; box-shadow: 0 4px 0 #064e3b !important; }
.tema-kasino .pbtn.on { transform: translateY(3px); }
.tema-kasino .gd-progress-bar { background: linear-gradient(90deg, #d4af37, #fff3c4) !important; }`,
    /* PASTEL: krem lembut, bulat-bulat, bayangan halus */
    pastel: `
.tema-pastel .gd-card { background: linear-gradient(160deg, #fff7f9, #f1fbff 60%, #fff9ec) !important; color: #6b5560; }
.tema-pastel .gd-header { background: rgba(255,255,255,.7) !important; border-bottom: 2px dashed ${alfa(a, '88')} !important; }
.tema-pastel .gd-title { color: #7a5c6b !important; text-shadow: none !important; }
.tema-pastel .gd-score { color: ${a} !important; text-shadow: none !important; }
.tema-pastel .gd-status, .tema-pastel .padhint, .tema-pastel .gd-best { color: #a58a97 !important; }
.tema-pastel canvas#game { border: 4px solid #fff !important; box-shadow: 0 10px 26px ${alfa(a, '44')} !important; border-radius: 24px !important; }
.tema-pastel .pbtn { border-radius: 999px !important; background: #fff !important; color: ${a} !important; border: 3px solid ${alfa(a, '66')} !important; box-shadow: 0 4px 10px ${alfa(a, '33')} !important; text-shadow: none !important; }
.tema-pastel .pbtn.on { background: ${a} !important; color: #fff !important; }`,
    /* CANDY: permen — gradasi pink/ungu, bintik gula, tombol gummy mengkilap */
    candy: `
.tema-candy .gd-card { background: radial-gradient(circle at 20% 10%, #ffd6ec 0, transparent 40%), radial-gradient(circle at 80% 90%, #d8c6ff 0, transparent 40%), linear-gradient(160deg, #7b2ff7, #f107a3) !important; }
.tema-candy .gd-header { background: rgba(255,255,255,.18) !important; border-bottom: 0 !important; }
.tema-candy .gd-title { color: #fff !important; text-shadow: 0 2px 0 #b0126e, 0 4px 10px rgba(0,0,0,.3) !important; font-family: 'Comic Sans MS', 'Segoe UI', sans-serif !important; }
.tema-candy .gd-sub { color: #ffe1f3 !important; }
.tema-candy .gd-score { color: #fff176 !important; text-shadow: 0 2px 0 #a36c00 !important; }
.tema-candy canvas#game { border: 5px solid #fff !important; border-radius: 26px !important; box-shadow: 0 10px 0 rgba(0,0,0,.18), 0 16px 30px rgba(0,0,0,.25) !important; }
.tema-candy .pbtn { border-radius: 22px !important; background: linear-gradient(180deg, #fff 0, #ffb3da 100%) !important; border: 3px solid #fff !important; color: #b0126e !important; text-shadow: none !important; box-shadow: 0 5px 0 #c94a95, inset 0 -6px 0 rgba(255,255,255,.4) !important; }
.tema-candy .pbtn.act { background: linear-gradient(180deg, #fff9c4, #ffd54f) !important; color: #7a4b00 !important; box-shadow: 0 5px 0 #c99a00 !important; }
.tema-candy .pbtn.on { transform: translateY(4px); box-shadow: 0 1px 0 #c94a95 !important; }`,
    /* JUNGLE: batu kuil, kayu, lumut — tombol batu ukir */
    jungle: `
.tema-jungle .gd-card { background: radial-gradient(ellipse at 50% 100%, #2f4a1f 0, #14200f 60%), #101a0c !important; }
.tema-jungle .gd-header { background: linear-gradient(180deg, #5b4324, #3b2a14) !important; border-bottom: 4px solid #8a6a3a !important; box-shadow: 0 4px 0 #22170a; }
.tema-jungle .gd-title { color: #ffe9b0 !important; font-family: Impact, 'Arial Black', sans-serif !important; letter-spacing: 1.5px !important; text-shadow: 2px 2px 0 #3b2a14, 0 0 12px rgba(255,200,80,.5) !important; }
.tema-jungle .gd-sub { color: #d9b87a !important; }
.tema-jungle .gd-score { color: #ffd54f !important; font-family: Impact, sans-serif !important; text-shadow: 2px 2px 0 #3b2a14 !important; }
.tema-jungle canvas#game { border: 6px solid #6b5230 !important; border-radius: 14px !important; box-shadow: 0 0 0 3px #3b2a14, 0 14px 30px rgba(0,0,0,.6) !important; }
.tema-jungle .pbtn { border-radius: 10px !important; background: linear-gradient(180deg, #8d7250, #5d4a2f) !important; border: 2px solid #bfa274 !important; color: #ffe9b0 !important; text-shadow: 1px 1px 0 #2b1d0c !important; box-shadow: 0 5px 0 #2b1d0c !important; }
.tema-jungle .pbtn.act { background: linear-gradient(180deg, #7cb342, #4b7a1f) !important; border-color: #c5e1a5 !important; box-shadow: 0 5px 0 #2f4a1f !important; }
.tema-jungle .pbtn.on { transform: translateY(4px); box-shadow: 0 1px 0 #2b1d0c !important; }`,
    /* CITY: langit kota senja, grafiti, tombol jalan raya */
    city: `
.tema-city .gd-card { background: linear-gradient(180deg, #ff9a3c 0, #ff5e62 30%, #2b1055 65%, #0c0a1e 100%) !important; }
.tema-city .gd-header { background: rgba(0,0,0,.35) !important; border-bottom: 3px solid ${a} !important; }
.tema-city .gd-title { color: #fff !important; font-family: Impact, 'Arial Black', sans-serif !important; font-style: italic; letter-spacing: 1px !important; text-shadow: 3px 3px 0 ${a}, -1px -1px 0 #000 !important; text-transform: uppercase; }
.tema-city .gd-sub { color: #ffe08a !important; }
.tema-city .gd-score { color: #ffe08a !important; font-family: Impact, sans-serif !important; text-shadow: 2px 2px 0 #000 !important; }
.tema-city canvas#game { border: 4px solid #fff !important; border-radius: 18px !important; box-shadow: 0 0 0 4px ${a}, 0 14px 30px rgba(0,0,0,.6) !important; }
.tema-city .pbtn { border-radius: 14px !important; background: #1c1c1c !important; border: 3px solid #fff !important; color: #ffe08a !important; text-shadow: none !important; box-shadow: 0 5px 0 ${a}, inset 0 0 0 2px #333 !important; }
.tema-city .pbtn.act { background: ${a} !important; color: #fff !important; box-shadow: 0 5px 0 #7a2e00 !important; }
.tema-city .pbtn.on { transform: translateY(4px); }`,
    /* PIXEL: 8-bit — biru langit, bata, tombol kotak berpiksel */
    pixel: `
.tema-pixel .gd-card { background: linear-gradient(180deg, #5c94fc 0, #5c94fc 70%, #c84c0c 70%, #c84c0c 100%) !important; image-rendering: pixelated; }
.tema-pixel .gd-header { background: #000 !important; border-bottom: 4px solid #fff !important; padding: 10px 14px !important; }
.tema-pixel .gd-sub { color: #9bd3ff !important; margin-bottom: 4px; }
.tema-pixel .gd-title { line-height: 1.2 !important; }
.tema-pixel .gd-title, .tema-pixel .gd-score, .tema-pixel .gd-sub, .tema-pixel .gd-best, .tema-pixel .gd-status, .tema-pixel .padhint { font-family: 'Courier New', monospace !important; font-weight: 900 !important; }
.tema-pixel .gd-title { color: #fff !important; text-shadow: 3px 3px 0 ${a} !important; text-transform: uppercase; letter-spacing: 2px !important; }
.tema-pixel .gd-score { color: #fbd000 !important; text-shadow: 2px 2px 0 #000 !important; }
.tema-pixel .gd-status { color: #fff !important; text-shadow: 1px 1px 0 #000; }
.tema-pixel canvas#game { border: 4px solid #000 !important; border-radius: 0 !important; box-shadow: 0 0 0 4px #fff, 0 0 0 8px #000 !important; image-rendering: pixelated; }
.tema-pixel .pbtn { border-radius: 0 !important; background: ${a} !important; border: 4px solid #000 !important; color: #fff !important; text-shadow: 2px 2px 0 #000 !important; box-shadow: inset -4px -4px 0 rgba(0,0,0,.35), inset 4px 4px 0 rgba(255,255,255,.35) !important; }
.tema-pixel .pbtn.act { background: ${b} !important; }
.tema-pixel .pbtn.on { box-shadow: inset 4px 4px 0 rgba(0,0,0,.35) !important; }`,
    /* GLASS: kaca beku modern, gradasi halus, minimal */
    glass: `
.tema-glass .gd-card { background: radial-gradient(circle at 10% 10%, ${alfa(a, '55')} 0, transparent 45%), radial-gradient(circle at 90% 90%, ${alfa(b, '55')} 0, transparent 45%), #0f172a !important; }
.tema-glass .gd-header { background: rgba(255,255,255,.06) !important; border-bottom: 1px solid rgba(255,255,255,.15) !important; backdrop-filter: blur(20px); }
.tema-glass .gd-title { color: #f8fafc !important; text-shadow: none !important; font-weight: 800 !important; letter-spacing: 0 !important; }
.tema-glass .gd-score { color: #f8fafc !important; text-shadow: none !important; }
.tema-glass canvas#game { border: 1px solid rgba(255,255,255,.18) !important; border-radius: 22px !important; box-shadow: 0 20px 50px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.2) !important; background: rgba(255,255,255,.04) !important; }
.tema-glass .pbtn { border-radius: 16px !important; background: rgba(255,255,255,.08) !important; border: 1px solid rgba(255,255,255,.22) !important; color: #fff !important; text-shadow: none !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.25) !important; }
.tema-glass .pbtn.on { background: rgba(255,255,255,.3) !important; }`
  }
  return '\n/* tema v7.9.1: ' + tema + ' */' + (T[tema] || T.neon) + '\n'
}

/* ------------------------------------------------------------------ */
/*  v7.7.3 — GAYA D-PAD PER GENRE GAME                                  */
/* ------------------------------------------------------------------ */
/*
 *  What users asked: tombol toggle (▲▼◀▶ ●) harus beda per genre:
 *   • neon   → kapsul neon tajam, glow cyan/pink (DEFAULT)
 *   • pastel → membulat lembut pink/mint
 *   • jadul  → kotak tebal logam era Game Boy (abu, hijau fosfat)
 *   • kasino → lingkaran rim emas + felt hijau gelap
 *  Urutan sumber style: o.padStyle > KONFIG_GAME.padStyle > tebak judul > o.skin
 */
export function gayaPad (title, skin = 'neon') {
  const t = String(title || '')
  if (/retro|3310|invader|pou jump/i.test(t)) return 'jadul'
  if (/casino|rolet|dadu|aviator|keno|blackjack|slot|baccarat|poker/i.test(t)) return 'kasino'
  if (skin === 'pastel') return 'pastel'
  return 'neon'
}

const PAD_STILUS = {
  neon: (p1, p2) =>
    '.pbtn { border-radius: 12px !important; border-width: 2px !important; }\n' +
    '.pad { gap: 7px !important; }\n',
  pastel: (p1, p2) =>
    '.pbtn { border-radius: 999px !important; border-width: 3px !important; color: #c2366d !important; background: rgba(255,255,255,0.92) !important; box-shadow: 0 3px 10px rgba(255,143,177,0.35) !important; }\n' +
    '.pbtn.on { background: #ff8fb1 !important; color: #ffffff !important; }\n' +
    '.pbtn.act { color: #2e9e73 !important; border-color: #8ee0c8 !important; background: #e8fff5 !important; }\n' +
    '.pbtn.act.on { background: #8ee0c8 !important; color: #ffffff !important; }\n' +
    '.pad { gap: 9px !important; }\n',
  jadul: (p1, p2) =>
    '.pbtn { border-radius: 4px !important; border-width: 4px !important; border-color: #3d4247 !important; background: #252d33 !important; color: #9acd32 !important; box-shadow: inset 0 2px 0 #55606a, 0 4px 0 #191f24 !important; font-family: monospace !important; font-weight: 900 !important; }\n' +
    '.pbtn.on { background: #9acd32 !important; color: #191f24 !important; border-color: #d8e9b0 !important; }\n' +
    '.pbtn.act { border-color: #70808a !important; background: #30414c !important; }\n' +
    '.pbtn.act.on { background: #70808a !important; color: #10151h !!important; color: #ffffff !important; }\n' +
    '.pad { gap: 6px !important; }\n' +
    '.padhint { font-family: monospace !important; letter-spacing: 1px !important; color: #9acd32 !important; }\n',
  /* v7.8.3 — gaya pad khusus game "rupa asli" */
  flappy: (p1, p2) =>
    '.pad { gap: 8px !important; max-width: 300px !important; }\n' +
    '.pbtn { border-radius: 6px !important; border: 3px solid #543847 !important; background: #f8b733 !important; color: #543847 !important; box-shadow: inset 0 -5px 0 #d9962a, 0 4px 0 #543847 !important; font-family: "Segoe UI", Arial, sans-serif !important; font-weight: 900 !important; text-shadow: none !important; }\n' +
    '.pbtn.on { background: #ffd366 !important; color: #543847 !important; box-shadow: inset 0 -2px 0 #d9962a, 0 1px 0 #543847 !important; transform: translateY(3px); }\n' +
    '.pbtn.act { background: #73bf2e !important; color: #fff !important; border-color: #543847 !important; box-shadow: inset 0 -5px 0 #558b22, 0 4px 0 #543847 !important; height: 64px !important; font-size: 26px !important; }\n' +
    '.pbtn.act.on { background: #8fd948 !important; box-shadow: inset 0 -2px 0 #558b22, 0 1px 0 #543847 !important; }\n' +
    '.padhint { color: #543847 !important; font-family: "Courier New", monospace !important; font-weight: 900 !important; }\n',
  pacman: (p1, p2) =>
    '.pad { gap: 6px !important; max-width: 270px !important; }\n' +
    '.pbtn { border-radius: 50% !important; border: 3px solid #2121de !important; background: #000 !important; color: #ffe600 !important; font-size: 22px !important; box-shadow: 0 0 10px rgba(33,33,222,0.7), inset 0 0 12px rgba(33,33,222,0.5) !important; text-shadow: 0 0 6px #ffe600 !important; height: 58px !important; }\n' +
    '.pbtn.on { background: #ffe600 !important; color: #000 !important; text-shadow: none !important; box-shadow: 0 0 16px #ffe600 !important; }\n' +
    '.pbtn.act { border-color: #ff0000 !important; color: #ff0000 !important; box-shadow: 0 0 10px rgba(255,0,0,0.6) !important; text-shadow: 0 0 6px #ff0000 !important; }\n' +
    '.pbtn.act.on { background: #ff0000 !important; color: #fff !important; }\n' +
    '.padhint { color: #ffe600 !important; font-family: "Courier New", monospace !important; letter-spacing: 1px !important; }\n',
  subway: (p1, p2) =>
    '.pad { gap: 8px !important; max-width: 290px !important; }\n' +
    '.pbtn { border-radius: 14px !important; border: 3px solid #1b365d !important; background: linear-gradient(180deg, #ffb347 0%, #ff7a00 100%) !important; color: #fff !important; font-size: 22px !important; box-shadow: 0 5px 0 #b34e00, 0 8px 14px rgba(0,0,0,0.35) !important; text-shadow: 0 2px 0 rgba(0,0,0,0.35) !important; height: 56px !important; }\n' +
    '.pbtn.on { transform: translateY(4px); box-shadow: 0 1px 0 #b34e00 !important; background: linear-gradient(180deg, #ffd27a 0%, #ff9a2e 100%) !important; }\n' +
    '.pbtn.act { background: linear-gradient(180deg, #4fc3f7 0%, #0288d1 100%) !important; box-shadow: 0 5px 0 #015384, 0 8px 14px rgba(0,0,0,0.35) !important; }\n' +
    '.pbtn.act.on { box-shadow: 0 1px 0 #015384 !important; }\n' +
    '.padhint { color: #ff7a00 !important; font-weight: 900 !important; }\n',
  candy: (p1, p2) =>
    '.pad { gap: 8px !important; max-width: 290px !important; }\n' +
    '.pbtn { border-radius: 999px !important; border: 3px solid #fff !important; background: linear-gradient(180deg, #ff8ac4 0%, #ff4fa3 100%) !important; color: #fff !important; font-size: 22px !important; box-shadow: 0 5px 0 #b3175e, 0 8px 14px rgba(0,0,0,0.3) !important; text-shadow: 0 2px 0 rgba(0,0,0,0.3) !important; height: 56px !important; }\n' +
    '.pbtn.on { transform: translateY(4px); box-shadow: 0 1px 0 #b3175e !important; }\n' +
    '.pbtn.act { background: linear-gradient(180deg, #ffe082 0%, #ffb300 100%) !important; box-shadow: 0 5px 0 #a86a00, 0 8px 14px rgba(0,0,0,0.3) !important; }\n' +
    '.pbtn.act.on { box-shadow: 0 1px 0 #a86a00 !important; }\n' +
    '.padhint { color: #ff8ac4 !important; font-weight: 900 !important; }\n',
  temple: (p1, p2) =>
    '.pad { gap: 8px !important; max-width: 290px !important; }\n' +
    '.pbtn { border-radius: 10px !important; border: 3px solid #3e2723 !important; background: linear-gradient(180deg, #a1887f 0%, #6d4c41 100%) !important; color: #ffe082 !important; font-size: 22px !important; box-shadow: 0 5px 0 #3e2723, 0 8px 14px rgba(0,0,0,0.4) !important; text-shadow: 0 2px 0 rgba(0,0,0,0.5) !important; height: 56px !important; }\n' +
    '.pbtn.on { transform: translateY(4px); box-shadow: 0 1px 0 #3e2723 !important; }\n' +
    '.pbtn.act { background: linear-gradient(180deg, #ffd54f 0%, #ff8f00 100%) !important; color: #3e2723 !important; box-shadow: 0 5px 0 #8d4a00, 0 8px 14px rgba(0,0,0,0.4) !important; }\n' +
    '.pbtn.act.on { box-shadow: 0 1px 0 #8d4a00 !important; }\n' +
    '.padhint { color: #ffd54f !important; font-weight: 900 !important; }\n',
  angry: (p1, p2) =>
    '.pad { gap: 8px !important; max-width: 290px !important; }\n' +
    '.pbtn { border-radius: 14px !important; border: 3px solid #5d4037 !important; background: linear-gradient(180deg, #ef5350 0%, #c62828 100%) !important; color: #fff !important; font-size: 22px !important; box-shadow: 0 5px 0 #7f0000, 0 8px 14px rgba(0,0,0,0.35) !important; text-shadow: 0 2px 0 rgba(0,0,0,0.4) !important; height: 56px !important; }\n' +
    '.pbtn.on { transform: translateY(4px); box-shadow: 0 1px 0 #7f0000 !important; }\n' +
    '.pbtn.act { background: linear-gradient(180deg, #aed581 0%, #7cb342 100%) !important; box-shadow: 0 5px 0 #33691e, 0 8px 14px rgba(0,0,0,0.35) !important; }\n' +
    '.pbtn.act.on { box-shadow: 0 1px 0 #33691e !important; }\n' +
    '.padhint { color: #ef9a9a !important; font-weight: 900 !important; }\n',
  mario: (p1, p2) =>
    '.pad { gap: 8px !important; max-width: 290px !important; }\n' +
    '.pbtn { border-radius: 8px !important; border: 3px solid #000 !important; background: #e52521 !important; color: #fff !important; font-size: 22px !important; box-shadow: 0 5px 0 #7a0000, inset 0 -3px 0 rgba(0,0,0,0.25) !important; text-shadow: 2px 2px 0 rgba(0,0,0,0.5) !important; height: 56px !important; font-family: monospace !important; }\n' +
    '.pbtn.on { transform: translateY(4px); box-shadow: 0 1px 0 #7a0000 !important; }\n' +
    '.pbtn.act { background: #f8b800 !important; color: #000 !important; text-shadow: none !important; box-shadow: 0 5px 0 #8a6200, inset 0 -3px 0 rgba(0,0,0,0.2) !important; }\n' +
    '.pbtn.act.on { box-shadow: 0 1px 0 #8a6200 !important; }\n' +
    '.padhint { color: #f8b800 !important; font-weight: 900 !important; }\n',
  kasino: (p1, p2) =>
    '.pbtn { border-radius: 999px !important; border-width: 3px !important; border-color: #fbbf24 !important; background: radial-gradient(circle at 50% 28%, #2f5233 0%, #123420 70%) !important; color: #fde047 !important; box-shadow: 0 4px 14px rgba(251,191,36,0.25), inset 0 2px 4px rgba(255,255,255,0.18) !important; }\n' +
    '.pbtn.on { background: #fde047 !important; color: #123420 !important; }\n' +
    '.pbtn.act { border-color: #f43f5e !important; background: radial-gradient(circle at 50% 28%, #7f1d1d 0%, #450a0a 70%) !important; color: #fecaca !important; }\n' +
    '.pbtn.act.on { background: #f43f5e !important; color: #ffffff !important; }\n' +
    '.pad { gap: 8px !important; }\n' +
    '.padhint { color: #fde047 !important; }\n'
}

/** css pad per gaya (p1/p2 = palet kartu untuk fallback border) */
export function cssPadGenre (gaya, palA, palB) {
  const fn = PAD_STILUS[gaya] || PAD_STILUS.neon
  return '\n/* gaya D-pad genre: ' + gaya + ' */\n' + fn(palA, palB)
}

export function shell (title, brand, gameJs, opts) {
  const konfig = KONFIG_GAME[title] || {}
  const o = Object.assign({ w: 640, h: 360, maxw: 640, hint: '', skin: 'neon', sub: 'ARCADE' }, konfig, opts || {})
  if (o.pad == null) o.pad = 'udlra'
  const pal = normalPal(o.palette, title, o.skin)
  const css = (o.skin === 'pastel' ? CSS_PASTEL : CSS) + cssPale(pal) + cssPadGenre(o.padStyle || konfig.padStyle || gayaPad(title, o.skin), pal[0], pal[1]) + CSS_FULL + cssTema(o.tema || temaGame(title, o.skin), pal[0], pal[1])
  o.palette = pal
  return '<style>' + css + '</style>' + markup(title, brand, o) + '<script>' + PRELUDE + gameJs + '\n})();\n</script>'
}

/* ------------------------------------------------------------------ */
/*  SNAKE NEON                                                         */
/* ------------------------------------------------------------------ */
const SNAKE_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var CELL = 20, COLS = c.width / CELL, ROWS = c.height / CELL;
  var snake, dir, nextDir, food, score, tick, acc, gameOver, speed, level, runT, paused;

  function reset () {
    snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
    dir = { x: 1, y: 0 }; nextDir = dir;
    placeFood();
    score = 0; tick = 0; acc = 0; gameOver = false; speed = 6; level = 1; runT = 0; paused = false;
    A.setScore(0); A.setBest(); A.setStatus('Level 1', 'Speed 6.0x'); A.setProgress(0);
  }
  function placeFood () {
    do { food = { x: Math.floor(A.rand(0, COLS)), y: Math.floor(A.rand(0, ROWS)) }; }
    while (snake.some(function (s) { return s.x === food.x && s.y === food.y; }));
  }
  function turn (x, y) { if (gameOver) { reset(); return; } if (dir.x === -x && dir.y === -y) return; nextDir = { x: x, y: y }; }

  function step () {
    dir = nextDir;
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || snake.some(function (s) { return s.x === head.x && s.y === head.y; })) {
      gameOver = true; A.SFX.crash();
      if (score > A.best) A.best = score;
      A.saveBest(A.best); A.setBest();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10; A.SFX.point(); A.setScore(score);
      if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
      var nl = Math.floor(score / 50) + 1;
      if (nl !== level) { level = nl; A.SFX.level(); }
      speed = Math.min(16, 6 + score * 0.08);
      A.setStatus('Level ' + level, 'Speed ' + speed.toFixed(1) + 'x');
      A.setProgress((score % 50) / 50);
      placeFood();
    } else snake.pop();
  }

  function draw () {
    var th = A.theme(level - 1);
    ctx.clearRect(0, 0, c.width, c.height);
    var bg = ctx.createLinearGradient(0, 0, 0, c.height);
    bg.addColorStop(0, '#060911'); bg.addColorStop(1, '#0e1322');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = th.primary; ctx.globalAlpha = 0.08; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var gx = 0; gx <= c.width; gx += CELL) { ctx.moveTo(gx, 0); ctx.lineTo(gx, c.height); }
    for (var gy = 0; gy <= c.height; gy += CELL) { ctx.moveTo(0, gy); ctx.lineTo(c.width, gy); }
    ctx.stroke(); ctx.globalAlpha = 1;

    ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 12; ctx.fillStyle = '#ff0055';
    ctx.beginPath(); ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3 + Math.sin(runT / 8) * 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    snake.forEach(function (s, i) {
      ctx.shadowColor = i === 0 ? '#ffffff' : th.primary; ctx.shadowBlur = i === 0 ? 14 : 8;
      ctx.fillStyle = i === 0 ? '#ffffff' : th.primary;
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = th.secondary;
      ctx.fillRect(s.x * CELL + 5, s.y * CELL + 5, CELL - 10, CELL - 10);
    });

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.78)'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 32px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', c.width / 2, c.height / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score), c.width / 2, c.height / 2 + 8);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('SWIPE / TAP UNTUK MAIN LAGI', c.width / 2, c.height / 2 + 38);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t; runT += dt;
    if (!gameOver && !paused) {
      acc += dt;
      var interval = 60 / speed;
      while (acc >= interval) { acc -= interval; step(); }
    }
    draw();
    if (paused && !gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.6)'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.textAlign = 'center'; ctx.fillStyle = '#00f3ff'; ctx.font = '900 30px "Segoe UI", sans-serif';
      ctx.fillText('JEDA', c.width / 2, c.height / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '600 14px "Segoe UI", sans-serif';
      ctx.fillText('tekan ● untuk lanjut', c.width / 2, c.height / 2 + 26);
      ctx.textAlign = 'left';
    }
    A.state = { snake: snake, food: food, dir: dir, score: score, over: gameOver, paused: paused, cols: COLS, rows: ROWS };
    requestAnimationFrame(loop);
  }

  var ts = null;
  c.addEventListener('touchstart', function (e) { ts = e.touches[0]; if (gameOver) reset(); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchend', function (e) {
    if (!ts) return;
    var dx = e.changedTouches[0].clientX - ts.clientX, dy = e.changedTouches[0].clientY - ts.clientY;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
    ts = null; e.preventDefault();
  }, { passive: false });
  c.addEventListener('mousedown', function () { if (gameOver) reset(); });
  window.addEventListener('keydown', function (e) {
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') { turn(0, -1); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { turn(0, 1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { turn(-1, 0); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { turn(1, 0); e.preventDefault(); }
    else if (k === 'Space') { if (gameOver) reset(); else paused = !paused; e.preventDefault(); }
  });

  reset();
  requestAnimationFrame(loop);
`

export function snakeHtml (brand = 'THERYHANN!') {
  return shell('Snake Neon', brand, SNAKE_JS, { w: 600, h: 600, maxw: 470, hint: '▲ ▼ ◀ ▶ = belok  ·  ● = jeda' })
}

/* ------------------------------------------------------------------ */
/*  FLAPPY NEON                                                        */
/* ------------------------------------------------------------------ */
const FLAPPY_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var GY = c.height - 40;
  var bird, pipes, score, speed, level, gameOver, spawnT, runT, particles, keys;

  function reset () {
    bird = { x: Math.round(c.width * 0.3), y: Math.round(c.height * 0.42), vy: 0, r: 15, rot: 0 };
    pipes = []; particles = []; keys = {};
    score = 0; speed = 3.2; level = 1; gameOver = false; spawnT = 40; runT = 0;
    A.setScore(0); A.setBest(); A.setStatus('Level 1', 'Speed 3.2x'); A.setProgress(0);
  }
  function flap () {
    A.initAudio();
    if (gameOver) { reset(); return; }
    bird.vy = -7.4; A.SFX.jump();
    for (var i = 0; i < 6; i++) particles.push({ x: bird.x - 8, y: bird.y + 8, vx: -A.rand(0.5, 2), vy: A.rand(0, 1.5), life: 1, size: A.rand(2, 4) });
  }
  function spawnPipe () {
    var gap = Math.max(110, 165 - level * 8);
    var top = A.rand(50, GY - gap - 50);
    pipes.push({ x: c.width + 30, top: top, gap: gap, w: 58, passed: false });
  }

  function update (dt) {
    runT += dt;
    if (gameOver) return;
    bird.vy += (keys.down ? 1.0 : 0.42) * dt; bird.y += bird.vy * dt;
    bird.rot = Math.max(-0.5, Math.min(1.1, bird.vy * 0.06));
    // ◀ ▶ geser horizontal (posisi burung bisa diatur)
    var vx = (keys.right ? 3.6 : 0) - (keys.left ? 3.6 : 0);
    bird.x += vx * dt;
    bird.x = Math.max(28, Math.min(c.width * 0.68, bird.x));
    spawnT -= dt;
    if (spawnT <= 0) { spawnPipe(); spawnT = Math.max(48, 92 - speed * 4); }
    pipes.forEach(function (p) { p.x -= speed * dt; });
    pipes = pipes.filter(function (p) { return p.x > -90; });
    particles.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.04 * dt; });
    particles = particles.filter(function (p) { return p.life > 0; });

    pipes.forEach(function (p) {
      if (!p.passed && p.x + p.w < bird.x) {
        p.passed = true; score += 10; A.SFX.point(); A.setScore(score);
        if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
        var nl = Math.floor(score / 60) + 1;
        if (nl !== level) { level = nl; A.SFX.level(); }
        speed = Math.min(7.5, 3.2 + score * 0.02);
        A.setStatus('Level ' + level, 'Speed ' + speed.toFixed(1) + 'x');
        A.setProgress((score % 60) / 60);
      }
      if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + p.w) {
        if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap) die();
      }
    });
    if (bird.y - bird.r < 0) { bird.y = bird.r; bird.vy = 0; }
    if (bird.y + bird.r > GY) die();
  }
  function die () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash();
    if (score > A.best) A.best = score;
    A.saveBest(A.best); A.setBest();
  }

  function draw () {
    var th = A.theme(level - 1);
    ctx.clearRect(0, 0, c.width, c.height);
    var bg = ctx.createLinearGradient(0, 0, 0, c.height);
    bg.addColorStop(0, '#060911'); bg.addColorStop(1, '#0e1322');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);

    ctx.fillStyle = th.primary; ctx.globalAlpha = 0.10;
    for (var i = 0; i < 24; i++) {
      var sx = (i * 97 - runT * speed * 0.6) % c.width; if (sx < 0) sx += c.width;
      ctx.fillRect(sx, (i * 53) % (GY - 20), 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(15,20,35,0.95)'; ctx.fillRect(0, GY, c.width, c.height - GY);
    ctx.shadowColor = th.primary; ctx.shadowBlur = 10; ctx.strokeStyle = th.primary; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(c.width, GY); ctx.stroke(); ctx.shadowBlur = 0;

    pipes.forEach(function (p) {
      ctx.shadowColor = th.secondary; ctx.shadowBlur = 10; ctx.fillStyle = th.secondary;
      ctx.fillRect(p.x, 0, p.w, p.top);
      ctx.fillRect(p.x, p.top + p.gap, p.w, GY - p.top - p.gap);
      ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x + 2, 2, p.w - 4, p.top - 4);
      ctx.strokeRect(p.x + 2, p.top + p.gap + 2, p.w - 4, GY - p.top - p.gap - 4);
    });

    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = th.primary;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(bird.x, bird.y); ctx.rotate(bird.rot);
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 14; ctx.fillStyle = '#ffffff';
    ctx.fillRect(-bird.r, -bird.r, bird.r * 2, bird.r * 2);
    ctx.shadowBlur = 0; ctx.fillStyle = '#060911';
    ctx.fillRect(-bird.r + 4, -bird.r + 4, bird.r * 2 - 8, bird.r * 2 - 8);
    ctx.fillStyle = th.primary;
    ctx.fillRect(-bird.r + 7, -bird.r + 7, bird.r * 2 - 14, bird.r * 2 - 14);
    ctx.restore();

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.78)'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 32px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', c.width / 2, c.height / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score), c.width / 2, c.height / 2 + 8);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('TAP ATAU TEKAN SPACE UNTUK MAIN LAGI', c.width / 2, c.height / 2 + 38);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { bird: bird, pipes: pipes, score: score, over: gameOver, ground: GY, keys: keys, w: c.width, h: c.height };
    requestAnimationFrame(loop);
  }

  c.addEventListener('touchstart', function (e) { flap(); e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', flap);
  window.addEventListener('keydown', function (e) {
    var k = e.code;
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') { flap(); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.down = true; e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.right = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowDown' || k === 'KeyS') keys.down = false;
    else if (k === 'ArrowLeft' || k === 'KeyA') keys.left = false;
    else if (k === 'ArrowRight' || k === 'KeyD') keys.right = false;
  });

  reset();
  requestAnimationFrame(loop);
`

export function flappyHtml (brand = 'THERYHANN!') {
  return shell('Flappy Neon', brand, FLAPPY_JS, { w: 500, h: 680, maxw: 400, hint: '▲ / ● = kepak  ·  ▼ = menukik  ·  ◀ ▶ = geser' })
}

export const ARCADE_GAMES = [
  { id: 'gd', title: 'Geometry Dash Mini', html: gdMiniHtml, ratio: '800\u00D7440 (1.82:1)' },
  { id: 'snake', title: 'Snake Neon', html: snakeHtml, ratio: '600\u00D7600 (1:1)' },
  { id: 'flappy', title: 'Flappy Neon', html: flappyHtml, ratio: '500\u00D7680 (portrait)' }
]

export default { gdMiniHtml, snakeHtml, flappyHtml, ARCADE_GAMES, shell, temaGame }
