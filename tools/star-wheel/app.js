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
  { name: "東方青龍", color: "#23684f", mansions: ["角","亢","氐","房","心","尾","箕"] },
  { name: "北方玄武", color: "#1f5b86", mansions: ["斗","牛","女","虛","危","室","壁"] },
  { name: "西方白虎", color: "#604472", mansions: ["奎","婁","胃","昴","畢","觜","參"] },
  { name: "南方朱雀", color: "#a72b20", mansions: ["井","鬼","柳","星","張","翼","軫"] }
];

const solarTerms = [
  "冬至","小寒","大寒","立春","雨水","驚蟄",
  "春分","清明","穀雨","立夏","小滿","芒種",
  "夏至","小暑","大暑","立秋","處暑","白露",
  "秋分","寒露","霜降","立冬","小雪","大雪"
];

function pad(n) {
  return String(n).padStart(2, "0");
}

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
    month: "long",
    day: "numeric",
    weekday: "short"
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
  manualRotation = 0;
  viewRotation = 0;
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
  compassButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  draw();
}

function getSkyRotation() {
  if (!dateInput.value) return manualRotation + viewRotation;

  const date = new Date(`${dateInput.value}T00:00:00`);
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  const minutes = Number(timeRange.value);

  return (minutes / 1440) * Math.PI * 2 +
    (dayOfYear / 365.2422) * Math.PI * 2 +
    manualRotation + viewRotation;
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

function polar(cx, cy, radius, angle) {
  return [
    cx + Math.cos(angle) * radius,
    cy + Math.sin(angle) * radius
  ];
}

function drawRingSegment(cx, cy, innerRadius, outerRadius, start, end, fill) {
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, start, end);
  ctx.arc(cx, cy, innerRadius, end, start, true);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "rgba(78,57,28,.72)";
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

function drawMansionAndTermRings(width, height, rotation) {
  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height) / 2;

  // The Taipei Astronomical Museum star disk occupies about 84% of the chart.
  // The traditional Chinese astronomy rings sit immediately outside it.
  const mansionInner = base * .835;
  const mansionOuter = base * .925;

  if (mansionsToggle.checked) {
    let index = 0;
    mansionGroups.forEach(group => {
      group.mansions.forEach(mansion => {
        const start = -Math.PI / 2 + rotation + index * Math.PI * 2 / 28;
        const end = -Math.PI / 2 + rotation + (index + 1) * Math.PI * 2 / 28;
        drawRingSegment(cx, cy, mansionInner, mansionOuter, start, end, group.color);
        drawTextOnRing(
          mansion,
          cx,
          cy,
          (mansionInner + mansionOuter) / 2,
          (start + end) / 2,
          "#f7edcf",
          Math.max(12, base * .036)
        );
        index += 1;
      });
    });
  }

  if (termsToggle.checked) {
    solarTerms.forEach((term, i) => {
      const angle = -Math.PI / 2 + rotation + i * Math.PI * 2 / 24;
      const color = [0, 6, 12, 18].includes(i) ? "#98281f" : "#15513a";
      drawTextOnRing(
        term,
        cx,
        cy,
        base * .975,
        angle,
        color,
        Math.max(9, base * .026),
        false
      );
    });
  }
}

function drawTeachingGrid(width, height) {
  if (!gridToggle.checked) return;

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * .42;

  ctx.save();
  ctx.strokeStyle = "rgba(153, 207, 232, .22)";
  ctx.fillStyle = "rgba(221, 239, 247, .82)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 5]);

  [.33, .66].forEach(mult => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * mult, 0, Math.PI * 2);
    ctx.stroke();
  });

  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 2;
    const [x1, y1] = polar(cx, cy, radius * .08, a);
    const [x2, y2] = polar(cx, cy, radius * .96, a);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.font = `600 ${Math.max(9, radius * .03)}px "Noto Serif TC", serif`;
  ctx.textAlign = "left";
  ctx.fillText("60°", cx + radius * .34, cy - 4);
  ctx.fillText("30°", cx + radius * .67, cy - 4);
  ctx.restore();
}

function drawTeachingLabels(width, height) {
  if (!labelsToggle.checked) return;

  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height) / 2;

  ctx.save();
  ctx.fillStyle = "rgba(238, 226, 192, .92)";
  ctx.strokeStyle = "rgba(238, 226, 192, .6)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(10, base * .027)}px "Noto Serif TC", serif`;

  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(2.5, base * .006), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText("北天極", cx, cy - base * .035);

  ctx.font = `600 ${Math.max(8, base * .021)}px "Noto Serif TC", serif`;
  ctx.fillStyle = "rgba(238, 226, 192, .75)";
  ctx.fillText("天文館星圖基底", cx, cy + base * .72);
  ctx.restore();
}

function draw() {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  if (!width || !height) return;

  const rotation = getSkyRotation();
  canvasWrap.style.setProperty("--star-map-rotation", `${rotation}rad`);
  canvasWrap.classList.toggle("map-soft", !linesToggle.checked);

  ctx.clearRect(0, 0, width, height);
  drawTeachingGrid(width, height);
  drawTeachingLabels(width, height);
  drawMansionAndTermRings(width, height, rotation);
}

function advanceTime() {
  let value = Number(timeRange.value) + Number(speedSelect.value);

  if (value >= 1440) {
    value -= 1440;
    const date = new Date(`${dateInput.value}T12:00:00`);
    date.setDate(date.getDate() + 1);
    dateInput.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  timeRange.value = value;
  updateReadout();
  draw();
}

function togglePlay() {
  if (isPlaying) {
    stopPlayback();
    return;
  }

  isPlaying = true;
  playText.textContent = "暫停星空運轉";
  playIcon.textContent = "Ⅱ";
  animationTimer = setInterval(advanceTime, 1000);
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

dateInput.addEventListener("change", () => {
  manualRotation = 0;
  updateReadout();
  draw();
});

timeRange.addEventListener("input", () => {
  manualRotation = 0;
  updateReadout();
  draw();
});

[linesToggle, labelsToggle, mansionsToggle, termsToggle, gridToggle].forEach(el => {
  el.addEventListener("change", draw);
});

function linkToggles(primary, compact) {
  primary.addEventListener("change", () => {
    compact.checked = primary.checked;
    draw();
  });

  compact.addEventListener("change", () => {
    primary.checked = compact.checked;
    draw();
  });
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

compassButtons.forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

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
