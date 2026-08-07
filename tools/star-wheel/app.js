const canvas = document.getElementById("skyCanvas");
const ctx = canvas.getContext("2d");

const dateInput = document.getElementById("dateInput");
const timeRange = document.getElementById("timeRange");
const timeText = document.getElementById("timeText");
const dateText = document.getElementById("dateText");
const linesToggle = document.getElementById("linesToggle");
const labelsToggle = document.getElementById("labelsToggle");
const mansionsToggle = document.getElementById("mansionsToggle");
const termsToggle = document.getElementById("termsToggle");
const gridToggle = document.getElementById("gridToggle");
const compactLinesToggle = document.getElementById("compactLinesToggle");
const compactTermsToggle = document.getElementById("compactTermsToggle");
const compactMansionsToggle = document.getElementById("compactMansionsToggle");
const playBtn = document.getElementById("playBtn");
const playText = document.getElementById("playText");
const playIcon = document.getElementById("playIcon");
const speedSelect = document.getElementById("speedSelect");
const nowBtn = document.getElementById("nowBtn");
const resetBtn = document.getElementById("resetBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const canvasWrap = document.getElementById("canvasWrap");
const viewText = document.getElementById("viewText");
const compassButtons = [...document.querySelectorAll("[data-view]")];
const quickTimeButtons = [...document.querySelectorAll("[data-time]")];

let manualRotation = 0;
let viewRotation = 0;
let isPlaying = false;
let animationTimer = null;
let dragging = false;
let lastPointerAngle = 0;

const mansionGroups = [
  { name: "東方青龍", color: "#2f6a50", mansions: ["角","亢","氐","房","心","尾","箕"] },
  { name: "北方玄武", color: "#1d567d", mansions: ["斗","牛","女","虛","危","室","壁"] },
  { name: "西方白虎", color: "#68466f", mansions: ["奎","婁","胃","昴","畢","觜","參"] },
  { name: "南方朱雀", color: "#9f3328", mansions: ["井","鬼","柳","星","張","翼","軫"] }
];

const solarTerms = [
  "冬至","小寒","大寒","立春","雨水","驚蟄",
  "春分","清明","穀雨","立夏","小滿","芒種",
  "夏至","小暑","大暑","立秋","處暑","白露",
  "秋分","寒露","霜降","立冬","小雪","大雪"
];

const constellations = [
  {
    name: "北斗七星",
    label: [0.34, 0.42],
    stars: [[.24,.43,1.9],[.31,.39,1.5],[.37,.42,1.5],[.43,.48,1.4],[.50,.51,1.5],[.56,.48,1.8],[.62,.43,1.6]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]],
    starNames: ["搖光","開陽","玉衡","天權","天璣","天璇","天樞"]
  },
  {
    name: "仙后座",
    label: [0.70, 0.25],
    stars: [[.60,.30,1.4],[.66,.23,1.5],[.72,.30,1.9],[.78,.23,1.5],[.83,.30,1.5]],
    lines: [[0,1],[1,2],[2,3],[3,4]]
  },
  {
    name: "天琴座",
    label: [0.62, 0.62],
    stars: [[.60,.55,2.5],[.56,.61,1.2],[.62,.65,1.1],[.66,.60,1.0]],
    lines: [[0,1],[1,2],[2,3],[3,0]]
  },
  {
    name: "獵戶座",
    label: [0.36, 0.74],
    stars: [[.28,.65,1.7],[.43,.64,2.0],[.32,.72,1.2],[.36,.73,1.2],[.40,.74,1.2],[.30,.83,2.2],[.43,.82,1.7]],
    lines: [[0,2],[2,3],[3,4],[4,1],[2,5],[4,6],[5,6]]
  },
  {
    name: "天蠍座",
    label: [0.24, 0.64],
    stars: [[.16,.56,1.4],[.20,.60,1.5],[.24,.65,2.4],[.27,.70,1.4],[.30,.76,1.2],[.27,.81,1.2],[.22,.83,1.3],[.19,.80,1.1]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]
  }
];

const backgroundStars = Array.from({ length: 260 }, (_, i) => {
  const a = (i * 137.508) * Math.PI / 180;
  const r = Math.sqrt(((i * 79) % 257) / 257) * .47;
  return {
    x: .5 + Math.cos(a) * r,
    y: .5 + Math.sin(a) * r,
    size: .4 + ((i * 31) % 9) / 10,
    alpha: .28 + ((i * 17) % 60) / 100
  };
});

function pad(n) { return String(n).padStart(2, "0"); }

function updateQuickTimeState() {
  const current = Number(timeRange.value);
  quickTimeButtons.forEach(button => {
    button.classList.toggle("active", Number(button.dataset.time) === current);
  });
}

function updateReadout() {
  const total = Number(timeRange.value);
  timeText.textContent = `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  const date = new Date(`${dateInput.value}T12:00:00`);
  dateText.textContent = new Intl.DateTimeFormat("zh-TW", {
    month: "long", day: "numeric", weekday: "short"
  }).format(date);
  updateQuickTimeState();
}

function setNow() {
  const now = new Date();
  dateInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  timeRange.value = now.getHours() * 60 + now.getMinutes();
  manualRotation = 0;
  updateReadout();
  draw();
}

function stopPlayback() {
  isPlaying = false;
  clearInterval(animationTimer);
  animationTimer = null;
  playText.textContent = "播放星空運轉";
  playIcon.textContent = "▶";
}

function resetAll() {
  stopPlayback();
  viewRotation = 0;
  manualRotation = 0;
  linesToggle.checked = true;
  labelsToggle.checked = true;
  mansionsToggle.checked = true;
  termsToggle.checked = true;
  gridToggle.checked = true;
  compactLinesToggle.checked = true;
  compactTermsToggle.checked = true;
  compactMansionsToggle.checked = true;
  setView("north");
  setNow();
}

function setView(view) {
  const views = {
    north: { angle: 0, label: "北" },
    east: { angle: -Math.PI / 2, label: "東" },
    south: { angle: Math.PI, label: "南" },
    west: { angle: Math.PI / 2, label: "西" }
  };
  const selected = views[view] || views.north;
  viewRotation = selected.angle;
  viewText.textContent = selected.label;
  compassButtons.forEach(button => button.classList.toggle("active", button.dataset.view === view));
  draw();
}

function getSkyRotation() {
  const date = new Date(`${dateInput.value}T00:00:00`);
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  const minutes = Number(timeRange.value);
  return (minutes / 1440) * Math.PI * 2 +
    (dayOfYear / 365.2422) * Math.PI * 2 + manualRotation + viewRotation;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
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

function project(nx, ny, width, height, angle, radiusScale = .66) {
  const size = Math.min(width, height) * radiusScale * 2;
  const ox = (width - size) / 2;
  const oy = (height - size) / 2;
  const [rx, ry] = rotatePoint(nx, ny, .5, .5, angle);
  return [ox + rx * size, oy + ry * size];
}

function polar(cx, cy, radius, angle) {
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
}

function drawRingSegment(cx, cy, innerRadius, outerRadius, start, end, fill) {
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, start, end);
  ctx.arc(cx, cy, innerRadius, end, start, true);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "rgba(78,57,28,.62)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawTextOnRing(text, cx, cy, radius, angle, color, size, rotate = true) {
  const [x, y] = polar(cx, cy, radius, angle);
  ctx.save();
  ctx.translate(x, y);
  if (rotate) ctx.rotate(angle + Math.PI / 2);
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px "Noto Serif TC", "PMingLiU", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawTraditionalRings(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height) / 2;
  const outer = base * .91;
  const degreeInner = base * .83;
  const mansionInner = base * .71;
  const skyRadius = base * .675;

  ctx.save();
  ctx.fillStyle = "rgba(239,225,191,.97)";
  ctx.beginPath();
  ctx.arc(cx, cy, outer, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#9d342a";
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let deg = 0; deg < 360; deg += 2) {
    const a = (deg - 90) * Math.PI / 180;
    const tickInner = degreeInner + (deg % 10 === 0 ? 0 : base * .025);
    const [x1, y1] = polar(cx, cy, tickInner, a);
    const [x2, y2] = polar(cx, cy, outer, a);
    ctx.strokeStyle = "#c83a32";
    ctx.lineWidth = deg % 10 === 0 ? 1.5 : .7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  for (let deg = 0; deg < 360; deg += 15) {
    const a = (deg - 90) * Math.PI / 180;
    drawTextOnRing(String(deg), cx, cy, (outer + degreeInner) / 2, a, "#2b2a25", Math.max(9, base * .027), false);
  }

  if (mansionsToggle.checked) {
    let index = 0;
    mansionGroups.forEach(group => {
      group.mansions.forEach(mansion => {
        const start = -Math.PI / 2 + index * Math.PI * 2 / 28;
        const end = -Math.PI / 2 + (index + 1) * Math.PI * 2 / 28;
        drawRingSegment(cx, cy, mansionInner, degreeInner, start, end, group.color);
        drawTextOnRing(mansion, cx, cy, (mansionInner + degreeInner) / 2, (start + end) / 2, "#f7edcf", Math.max(14, base * .04));
        index += 1;
      });
    });
  }

  if (termsToggle.checked) {
    solarTerms.forEach((term, i) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / 24;
      const color = [0,6,12,18].includes(i) ? "#98281f" : "#15513a";
      drawTextOnRing(term, cx, cy, base * .975, angle, color, Math.max(10, base * .029), false);
    });
  }

  ctx.fillStyle = "#051b2b";
  ctx.beginPath();
  ctx.arc(cx, cy, skyRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#efe0b4";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  return { cx, cy, skyRadius };
}

function drawGrid(cx, cy, radius) {
  ctx.save();
  ctx.strokeStyle = "rgba(214,232,241,.16)";
  ctx.lineWidth = 1;
  [.35, .65, 1].forEach(mult => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * mult, 0, Math.PI * 2);
    ctx.stroke();
  });
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * radius * .1, cy + Math.sin(a) * radius * .1);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStar(x, y, radius, alpha = 1) {
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 5);
  glow.addColorStop(0, `rgba(255,255,255,${alpha})`);
  glow.addColorStop(.25, `rgba(215,235,255,${alpha * .8})`);
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
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  if (!width || !height) return;

  ctx.clearRect(0, 0, width, height);
  const { cx, cy, skyRadius } = drawTraditionalRings(width, height);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, skyRadius, 0, Math.PI * 2);
  ctx.clip();

  const skyGradient = ctx.createRadialGradient(cx, cy * .96, 0, cx, cy, skyRadius);
  skyGradient.addColorStop(0, "rgba(20,68,98,.42)");
  skyGradient.addColorStop(.55, "rgba(5,31,49,.28)");
  skyGradient.addColorStop(1, "rgba(1,12,22,.9)");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(cx - skyRadius, cy - skyRadius, skyRadius * 2, skyRadius * 2);

  if (gridToggle.checked) drawGrid(cx, cy, skyRadius);
  const angle = getSkyRotation();

  backgroundStars.forEach(star => {
    const [x, y] = project(star.x, star.y, width, height, angle, .66);
    drawStar(x, y, star.size, star.alpha);
  });

  const allProjected = constellations.map(c => ({
    ...c,
    projected: c.stars.map(s => project(s[0], s[1], width, height, angle, .66)),
    labelPoint: project(c.label[0], c.label[1], width, height, angle, .66)
  }));

  if (linesToggle.checked) {
    ctx.save();
    ctx.strokeStyle = "rgba(238,213,162,.68)";
    ctx.lineWidth = 1.25;
    allProjected.forEach(c => c.lines.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(...c.projected[a]);
      ctx.lineTo(...c.projected[b]);
      ctx.stroke();
    }));
    ctx.restore();
  }

  allProjected.forEach(c => c.projected.forEach((p, i) => drawStar(p[0], p[1], c.stars[i][2], .95)));

  const [px, py] = project(.5, .5, width, height, angle, .66);
  drawStar(px, py, 2.8, 1);
  ctx.fillStyle = "rgba(245,230,194,.95)";
  ctx.font = `700 ${Math.max(12, skyRadius * .035)}px "Noto Serif TC", serif`;
  ctx.fillText("北極星", px + 10, py - 12);

  if (labelsToggle.checked) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    allProjected.forEach(c => {
      ctx.font = `700 ${Math.max(12, skyRadius * .035)}px "Noto Serif TC", serif`;
      ctx.fillStyle = "rgba(244,231,196,.94)";
      ctx.fillText(c.name, c.labelPoint[0], c.labelPoint[1]);
      if (c.starNames) {
        c.starNames.forEach((name, i) => {
          const [sx, sy] = c.projected[i];
          ctx.font = `600 ${Math.max(9, skyRadius * .024)}px "Noto Serif TC", serif`;
          ctx.fillText(name, sx, sy - 12);
        });
      }
    });
    ctx.restore();
  }
  ctx.restore();
}

function advanceTime() {
  let value = Number(timeRange.value) + Number(speedSelect.value);
  if (value >= 1440) {
    value -= 1440;
    const d = new Date(`${dateInput.value}T12:00:00`);
    d.setDate(d.getDate() + 1);
    dateInput.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  timeRange.value = value;
  updateReadout();
  draw();
}

function togglePlay() {
  if (isPlaying) {
    stopPlayback();
  } else {
    isPlaying = true;
    playText.textContent = "暫停星空運轉";
    playIcon.textContent = "Ⅱ";
    animationTimer = setInterval(advanceTime, 1000);
  }
}

function getPointerAngle(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  return Math.atan2(y, x);
}

canvas.addEventListener("pointerdown", event => {
  dragging = true;
  lastPointerAngle = getPointerAngle(event);
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (!dragging) return;
  const next = getPointerAngle(event);
  let delta = next - lastPointerAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  manualRotation += delta;
  lastPointerAngle = next;
  draw();
});
canvas.addEventListener("pointerup", () => { dragging = false; });
canvas.addEventListener("pointercancel", () => { dragging = false; });

dateInput.addEventListener("change", () => { manualRotation = 0; updateReadout(); draw(); });
timeRange.addEventListener("input", () => { manualRotation = 0; updateReadout(); draw(); });
[linesToggle, labelsToggle, mansionsToggle, termsToggle, gridToggle].forEach(el => el.addEventListener("change", draw));

function linkToggles(primary, compact) {
  primary.addEventListener("change", () => { compact.checked = primary.checked; draw(); });
  compact.addEventListener("change", () => { primary.checked = compact.checked; draw(); });
}
linkToggles(linesToggle, compactLinesToggle);
linkToggles(termsToggle, compactTermsToggle);
linkToggles(mansionsToggle, compactMansionsToggle);

quickTimeButtons.forEach(button => {
  button.addEventListener("click", () => {
    timeRange.value = button.dataset.time;
    manualRotation = 0;
    updateReadout();
    draw();
  });
});
compassButtons.forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));

playBtn.addEventListener("click", togglePlay);
nowBtn.addEventListener("click", setNow);
resetBtn.addEventListener("click", resetAll);

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

setView("north");
setNow();
resizeCanvas();
