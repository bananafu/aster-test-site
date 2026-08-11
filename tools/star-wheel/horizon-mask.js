(() => {
  const wrap = document.getElementById('canvasWrap');
  const baseCanvas = document.getElementById('skyCanvas');
  const toggle = document.getElementById('horizonToggle');
  if (!wrap || !baseCanvas || !toggle) return;

  const mask = document.getElementById('horizonMaskCanvas');
  if (!mask) return;
  const ctx = mask.getContext('2d');

  const LAT = 23.5 * Math.PI / 180;
  const MIN_DEC = -60;
  const DEG = Math.PI / 180;

  function geometry() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const s = Math.min(w, h);
    return {
      w, h, s,
      cx: w / 2,
      cy: h / 2,
      starR: s * 0.398
    };
  }

  // Fixed horizon path for latitude 23.5°N in the same polar projection
  // as the rotating star disk.  The disk moves; this aperture never does.
  function buildHorizonPath(g) {
    const path = new Path2D();
    let first = true;

    for (let i = 0; i <= 360; i++) {
      const H = (-180 + i) * DEG;
      // altitude = 0° => tan(dec) = -cot(phi) * cos(H)
      const dec = Math.atan2(-Math.cos(LAT) * Math.cos(H), Math.sin(LAT)) / DEG;
      const clampedDec = Math.max(MIN_DEC, dec);
      const r = (90 - clampedDec) / (90 - MIN_DEC) * g.starR;
      const angle = (-H / DEG - 90) * DEG;
      const x = g.cx + Math.cos(angle) * r;
      const y = g.cy + Math.sin(angle) * r;
      if (first) {
        path.moveTo(x, y);
        first = false;
      } else {
        path.lineTo(x, y);
      }
    }
    path.closePath();
    return path;
  }

  function drawAltitudeGuides(g, aperture) {
    const guides = [30, 60];
    ctx.save();
    ctx.clip(aperture);
    ctx.setLineDash([6, 7]);
    ctx.lineWidth = Math.max(1, g.s * 0.0012);
    ctx.strokeStyle = 'rgba(86, 201, 238, .58)';
    ctx.fillStyle = 'rgba(230, 248, 255, .9)';
    ctx.font = `600 ${Math.max(11, g.s * 0.016)}px "Noto Serif TC", serif`;
    ctx.textAlign = 'center';

    // These circles are teaching guides, not exact almucantars; the visible-sky
    // mask itself is the exact 0° horizon in the projection.
    guides.forEach((alt, idx) => {
      const radius = g.starR * (idx === 0 ? 0.58 : 0.34);
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(`${alt}°`, g.cx, g.cy - radius - 4);
    });
    ctx.restore();
  }

  function draw() {
    const g = geometry();
    if (!g.w || !g.h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mask.width = Math.round(g.w * dpr);
    mask.height = Math.round(g.h * dpr);
    mask.style.width = `${g.w}px`;
    mask.style.height = `${g.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, g.w, g.h);

    if (!toggle.checked) return;

    const aperture = buildHorizonPath(g);

    // Darken every part of the star disk that lies below the local horizon.
    ctx.save();
    ctx.fillStyle = 'rgba(3, 12, 24, .84)';
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.starR + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill(aperture);
    ctx.restore();

    // Horizon boundary.
    ctx.save();
    ctx.strokeStyle = '#75c7ef';
    ctx.lineWidth = Math.max(3, g.s * 0.008);
    ctx.stroke(aperture);
    ctx.restore();

    // Cardinal directions in the same orientation as a Taiwan planisphere.
    const fs = Math.max(18, g.s * 0.032);
    ctx.save();
    ctx.fillStyle = '#f7f4e9';
    ctx.font = `800 ${fs}px "Noto Serif TC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('南', g.cx, g.cy - g.starR * 0.96);
    ctx.fillText('北', g.cx, g.cy + g.starR * 0.96);
    ctx.fillText('東', g.cx - g.starR * 0.96, g.cy);
    ctx.fillText('西', g.cx + g.starR * 0.96, g.cy);
    ctx.restore();

    const gridToggle = document.getElementById('gridToggle');
    if (gridToggle?.checked) drawAltitudeGuides(g, aperture);
  }

  toggle.addEventListener('change', draw);
  document.getElementById('gridToggle')?.addEventListener('change', draw);
  window.addEventListener('resize', draw);

  if ('ResizeObserver' in window) {
    new ResizeObserver(draw).observe(wrap);
  }

  // Redraw while time/date/animation changes the disk underneath.
  ['input', 'change'].forEach(evt => {
    document.getElementById('timeRange')?.addEventListener(evt, draw);
    document.getElementById('dateInput')?.addEventListener(evt, draw);
  });
  document.getElementById('nowBtn')?.addEventListener('click', () => requestAnimationFrame(draw));
  document.getElementById('resetBtn')?.addEventListener('click', () => requestAnimationFrame(draw));

  requestAnimationFrame(draw);
})();
