const canvas = document.getElementById("skyCanvas");
const ctx = canvas.getContext("2d");

const dateInput = document.getElementById("dateInput");
const timeRange = document.getElementById("timeRange");
const timeText = document.getElementById("timeText");
const dateText = document.getElementById("dateText");
const linesToggle = document.getElementById("linesToggle");
const labelsToggle = document.getElementById("labelsToggle");
const gridToggle = document.getElementById("gridToggle");
const playBtn = document.getElementById("playBtn");
const playText = document.getElementById("playText");
const playIcon = document.getElementById("playIcon");
const speedSelect = document.getElementById("speedSelect");
const nowBtn = document.getElementById("nowBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const canvasWrap = document.getElementById("canvasWrap");

let manualRotation = 0;
let isPlaying = false;
let animationTimer = null;
let dragging = false;
let lastPointerAngle = 0;

const constellations = [
  {
    name: "北斗七星",
    label: [0.30, 0.27],
    stars: [[.19,.25,1.8],[.25,.22,1.4],[.31,.25,1.4],[.36,.31,1.3],[.43,.34,1.4],[.49,.31,1.7],[.55,.26,1.5]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]
  },
  {
    name: "仙后座",
    label: [0.69, 0.22],
    stars: [[.59,.29,1.4],[.65,.23,1.5],[.71,.29,1.8],[.77,.22,1.4],[.82,.28,1.5]],
    lines: [[0,1],[1,2],[2,3],[3,4]]
  },
  {
    name: "天鵝座",
    label: [0.72, 0.50],
    stars: [[.69,.40,1.6],[.71,.48,2.0],[.73,.57,1.4],[.63,.48,1.3],[.80,.48,1.4]],
    lines: [[0,1],[1,2],[3,1],[1,4]]
  },
  {
    name: "天琴座",
    label: [0.56, 0.48],
    stars: [[.56,.43,2.5],[.52,.49,1.2],[.58,.52,1.1],[.61,.47,1.0]],
    lines: [[0,1],[1,2],[2,3],[3,0]]
  },
  {
    name: "獵戶座",
    label: [0.42, 0.72],
    stars: [[.34,.63,1.7],[.48,.62,2.0],[.38,.70,1.2],[.42,.71,1.2],[.46,.72,1.2],[.36,.81,2.2],[.49,.80,1.7]],
    lines: [[0,2],[2,3],[3,4],[4,1],[2,5],[4,6],[5,6]]
  },
  {
    name: "大犬座",
    label: [0.64, 0.78],
    stars: [[.61,.73,2.8],[.66,.78,1.4],[.71,.83,1.2],[.61,.86,1.2],[.55,.81,1.1]],
    lines: [[0,1],[1,2],[1,3],[3,4],[4,0]]
  },
  {
    name: "天蠍座",
    label: [0.25, 0.68],
    stars: [[.18,.58,1.4],[.22,.62,1.5],[.25,.67,2.4],[.28,.72,1.4],[.31,.77,1.2],[.28,.82,1.2],[.23,.84,1.3],[.20,.81,1.1]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]
  }
];

const backgroundStars = Array.from({length: 180}, (_, i) => {
  const a = (i * 137.508) * Math.PI / 180;
  const r = Math.sqrt(((i * 73) % 179) / 179) * .47;
  return {
    x: .5 + Math.cos(a) * r,
    y: .5 + Math.sin(a) * r,
    size: .45 + ((i * 31) % 10) / 10,
    alpha: .28 + ((i * 17) % 60) / 100
  };
});

function pad(n) {
  return String(n).padStart(2, "0");
}

function setNow() {
  const now = new Date();
  dateInput.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  timeRange.value = now.getHours() * 60 + now.getMinutes();
  manualRotation = 0;
  updateReadout();
  draw();
}

function updateReadout() {
  const total = Number(timeRange.value);
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  timeText.textContent = `${pad(hour)}:${pad(minute)}`;

  const date = new Date(`${dateInput.value}T12:00:00`);
  dateText.textContent = new Intl.DateTimeFormat("zh-TW", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function getSkyRotation() {
  const date = new Date(`${dateInput.value}T00:00:00`);
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  const minutes = Number(timeRange.value);

  // 星空每天約提早 4 分鐘，因此日期與時間共同控制旋轉。
  return ((minutes / 1440) * Math.PI * 2) +
         ((dayOfYear / 365.2422) * Math.PI * 2) +
         manualRotation;
}

function resizeCanvas() {
  const rect = canvasWrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function rotatePoint(x, y, cx, cy, angle) {
  const dx = x - cx;
  const dy = y - cy;
  return [
    cx + dx * Math.cos(angle) - dy * Math.sin(angle),
    cy + dx * Math.sin(angle) + dy * Math.cos(angle)
  ];
}

function project(nx, ny, width, height, angle) {
  const size = Math.min(width, height) * .88;
  const ox = (width - size) / 2;
  const oy = (height - size) / 2;
  const [rx, ry] = rotatePoint(nx, ny, .5, .5, angle);
  return [ox + rx * size, oy + ry * size];
}

function drawGrid(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * .44;

  ctx.save();
  ctx.strokeStyle = "rgba(150, 210, 245, .14)";
  ctx.lineWidth = 1;

  [1, .72, .44].forEach(mult => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * mult, 0, Math.PI * 2);
    ctx.stroke();
  });

  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * radius * .15, cy + Math.sin(a) * radius * .15);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(185, 231, 255, .34)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawStar(x, y, radius, alpha = 1) {
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 5);
  glow.addColorStop(0, `rgba(255,255,255,${alpha})`);
  glow.addColorStop(.2, `rgba(205,233,255,${alpha * .85})`);
  glow.addColorStop(1, "rgba(140,210,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(.7, radius), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw() {
  const rect = canvasWrap.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  if (!width || !height) return;

  ctx.clearRect(0, 0, width, height);

  const skyGradient = ctx.createRadialGradient(width*.5, height*.48, 0, width*.5, height*.5, Math.max(width,height)*.65);
  skyGradient.addColorStop(0, "rgba(15, 55, 83, .35)");
  skyGradient.addColorStop(.55, "rgba(5, 20, 36, .15)");
  skyGradient.addColorStop(1, "rgba(0, 3, 9, .55)");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0,0,width,height);

  if (gridToggle.checked) drawGrid(width, height);

  const angle = getSkyRotation();

  backgroundStars.forEach(star => {
    const [x,y] = project(star.x, star.y, width, height, angle);
    drawStar(x, y, star.size, star.alpha);
  });

  const allProjected = constellations.map(c => ({
    ...c,
    projected: c.stars.map(s => project(s[0], s[1], width, height, angle)),
    labelPoint: project(c.label[0], c.label[1], width, height, angle)
  }));

  if (linesToggle.checked) {
    ctx.save();
    ctx.strokeStyle = "rgba(141, 216, 255, .48)";
    ctx.lineWidth = 1.35;
    allProjected.forEach(c => {
      c.lines.forEach(([a,b]) => {
        ctx.beginPath();
        ctx.moveTo(...c.projected[a]);
        ctx.lineTo(...c.projected[b]);
        ctx.stroke();
      });
    });
    ctx.restore();
  }

  allProjected.forEach(c => {
    c.projected.forEach((p, i) => {
      drawStar(p[0], p[1], c.stars[i][2], .95);
    });
  });

  // 北極星
  const [px, py] = project(.5, .5, width, height, angle);
  drawStar(px, py, 2.6, 1);
  ctx.save();
  ctx.fillStyle = "rgba(183,245,223,.92)";
  ctx.font = '600 12px "Noto Sans TC", sans-serif';
  ctx.fillText("北極星", px + 10, py - 10);
  ctx.restore();

  if (labelsToggle.checked) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '600 13px "Noto Sans TC", sans-serif';
    allProjected.forEach(c => {
      const [x,y] = c.labelPoint;
      ctx.fillStyle = "rgba(3, 11, 20, .66)";
      const metrics = ctx.measureText(c.name);
      ctx.fillRect(x - metrics.width/2 - 7, y - 11, metrics.width + 14, 22);
      ctx.fillStyle = "rgba(235, 246, 255, .92)";
      ctx.fillText(c.name, x, y);
    });
    ctx.restore();
  }
}

function advanceTime() {
  let value = Number(timeRange.value) + Number(speedSelect.value);
  if (value >= 1440) {
    value -= 1440;
    const d = new Date(`${dateInput.value}T12:00:00`);
    d.setDate(d.getDate() + 1);
    dateInput.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  timeRange.value = value;
  updateReadout();
  draw();
}

function togglePlay() {
  isPlaying = !isPlaying;
  playText.textContent = isPlaying ? "暫停星空運動" : "播放星空運動";
  playIcon.textContent = isPlaying ? "Ⅱ" : "▶";
  if (isPlaying) {
    animationTimer = setInterval(advanceTime, 1000);
  } else {
    clearInterval(animationTimer);
  }
}

function getPointerAngle(event) {
  const rect = canvasWrap.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width/2;
  const y = event.clientY - rect.top - rect.height/2;
  return Math.atan2(y, x);
}

canvasWrap.addEventListener("pointerdown", event => {
  dragging = true;
  lastPointerAngle = getPointerAngle(event);
  canvasWrap.setPointerCapture(event.pointerId);
});

canvasWrap.addEventListener("pointermove", event => {
  if (!dragging) return;
  const next = getPointerAngle(event);
  let delta = next - lastPointerAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  manualRotation += delta;
  lastPointerAngle = next;
  draw();
});

canvasWrap.addEventListener("pointerup", () => dragging = false);
canvasWrap.addEventListener("pointercancel", () => dragging = false);

dateInput.addEventListener("change", () => { manualRotation = 0; updateReadout(); draw(); });
timeRange.addEventListener("input", () => { manualRotation = 0; updateReadout(); draw(); });
[linesToggle, labelsToggle, gridToggle].forEach(el => el.addEventListener("change", draw));

document.querySelectorAll("[data-time]").forEach(button => {
  button.addEventListener("click", () => {
    timeRange.value = button.dataset.time;
    manualRotation = 0;
    updateReadout();
    draw();
  });
});

playBtn.addEventListener("click", togglePlay);
nowBtn.addEventListener("click", setNow);

fullscreenBtn.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      fullscreenBtn.textContent = "離開全螢幕";
    } else {
      await document.exitFullscreen();
      fullscreenBtn.textContent = "全螢幕";
    }
  } catch (error) {
    console.warn("瀏覽器不支援全螢幕模式", error);
  }
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) fullscreenBtn.textContent = "全螢幕";
  setTimeout(resizeCanvas, 80);
});

window.addEventListener("resize", resizeCanvas);

setNow();
resizeCanvas();
