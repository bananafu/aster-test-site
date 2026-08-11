/* Interaction layer inspired by the operation pattern of a physical/digital planisphere.
   Layout remains fully controlled by index.html + style.css. */
(() => {
  const dateInput = document.getElementById('dateInput');
  const timeRange = document.getElementById('timeRange');
  const nowBtn = document.getElementById('nowBtn');
  const canvasWrap = document.getElementById('canvasWrap');
  if (!dateInput || !timeRange || !canvasWrap) return;

  const pad = n => String(n).padStart(2, '0');

  // ----- Month / day dropdown controller -----
  const originalDateField = dateInput.closest('.field');
  if (originalDateField) {
    originalDateField.classList.add('native-date-field');

    const group = document.createElement('div');
    group.className = 'planisphere-date-selectors';
    group.innerHTML = `
      <label>月份
        <select id="monthSelect" aria-label="月份"></select>
      </label>
      <label>日期
        <select id="daySelect" aria-label="日期"></select>
      </label>
    `;
    originalDateField.insertAdjacentElement('afterend', group);

    const monthSelect = group.querySelector('#monthSelect');
    const daySelect = group.querySelector('#daySelect');

    for (let m = 1; m <= 12; m++) {
      const option = document.createElement('option');
      option.value = m;
      option.textContent = `${m} 月`;
      monthSelect.appendChild(option);
    }

    function daysInMonth(year, month) {
      return new Date(year, month, 0).getDate();
    }

    function rebuildDays(selectedDay) {
      const [year] = dateInput.value.split('-').map(Number);
      const month = Number(monthSelect.value);
      const max = daysInMonth(year || new Date().getFullYear(), month);
      daySelect.innerHTML = '';
      for (let d = 1; d <= max; d++) {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = `${d} 日`;
        daySelect.appendChild(option);
      }
      daySelect.value = Math.min(selectedDay || 1, max);
    }

    function syncSelectorsFromDate() {
      if (!dateInput.value) return;
      const [, month, day] = dateInput.value.split('-').map(Number);
      monthSelect.value = month;
      rebuildDays(day);
    }

    function applySelectorsToDate() {
      const [year] = dateInput.value.split('-').map(Number);
      const y = year || new Date().getFullYear();
      dateInput.value = `${y}-${pad(monthSelect.value)}-${pad(daySelect.value)}`;
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    monthSelect.addEventListener('change', () => {
      const day = Number(daySelect.value || 1);
      rebuildDays(day);
      applySelectorsToDate();
    });
    daySelect.addEventListener('change', applySelectorsToDate);
    dateInput.addEventListener('change', syncSelectorsFromDate);
    nowBtn?.addEventListener('click', () => setTimeout(syncSelectorsFromDate, 0));

    syncSelectorsFromDate();
  }

  // ----- Hour drag controller -----
  const hourBox = document.createElement('div');
  hourBox.className = 'hour-drag-control';
  hourBox.innerHTML = `
    <span class="hour-caption">拖曳時間</span>
    <div class="hour-track" role="slider" aria-label="時間" aria-valuemin="0" aria-valuemax="1435" tabindex="0">
      <div class="hour-fill"></div>
      <button class="hour-knob" type="button" tabindex="-1" aria-hidden="true"></button>
    </div>
    <div class="hour-labels"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
  `;
  timeRange.insertAdjacentElement('afterend', hourBox);
  timeRange.classList.add('native-time-range');

  const track = hourBox.querySelector('.hour-track');
  const fill = hourBox.querySelector('.hour-fill');
  const knob = hourBox.querySelector('.hour-knob');

  function syncHourUI() {
    const pct = Number(timeRange.value) / 1435 * 100;
    fill.style.width = `${pct}%`;
    knob.style.left = `${pct}%`;
    track.setAttribute('aria-valuenow', timeRange.value);
  }

  function setHourFromPointer(clientX) {
    const r = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const value = Math.round((pct * 1435) / 5) * 5;
    timeRange.value = value;
    timeRange.dispatchEvent(new Event('input', { bubbles: true }));
    syncHourUI();
  }

  let draggingHour = false;
  track.addEventListener('pointerdown', e => {
    draggingHour = true;
    track.setPointerCapture(e.pointerId);
    setHourFromPointer(e.clientX);
  });
  track.addEventListener('pointermove', e => {
    if (draggingHour) setHourFromPointer(e.clientX);
  });
  track.addEventListener('pointerup', () => draggingHour = false);
  track.addEventListener('pointercancel', () => draggingHour = false);
  track.addEventListener('keydown', e => {
    let delta = 0;
    if (e.key === 'ArrowLeft') delta = -5;
    if (e.key === 'ArrowRight') delta = 5;
    if (e.key === 'PageDown') delta = -60;
    if (e.key === 'PageUp') delta = 60;
    if (!delta) return;
    e.preventDefault();
    timeRange.value = Math.max(0, Math.min(1435, Number(timeRange.value) + delta));
    timeRange.dispatchEvent(new Event('input', { bubbles: true }));
    syncHourUI();
  });
  timeRange.addEventListener('input', syncHourUI);
  nowBtn?.addEventListener('click', () => setTimeout(syncHourUI, 0));
  syncHourUI();

  // ----- Operation tutorial -----
  const tutorialBtn = document.createElement('button');
  tutorialBtn.type = 'button';
  tutorialBtn.className = 'tutorial-button';
  tutorialBtn.textContent = '? 操作教學';
  document.querySelector('.header-actions')?.prepend(tutorialBtn);

  const overlay = document.createElement('div');
  overlay.className = 'tutorial-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorialTitle">
      <button class="tutorial-close" type="button" aria-label="關閉">×</button>
      <h2 id="tutorialTitle">星座盤操作方式</h2>
      <ol>
        <li><strong>選日期：</strong>使用月份與日期下拉選單。</li>
        <li><strong>對時間：</strong>拖曳時間軸，星盤會同步轉到對應時刻。</li>
        <li><strong>轉星盤：</strong>直接拖曳中央星盤，可手動比較不同位置。</li>
        <li><strong>看天空：</strong>固定地平線罩片不會旋轉，罩片內就是當時可見天空。</li>
        <li><strong>輔助判讀：</strong>需要時開啟高度角透明片、星座名稱與亮星名稱。</li>
      </ol>
      <button class="tutorial-done" type="button">開始操作</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeTutorial = () => { overlay.hidden = true; };
  tutorialBtn.addEventListener('click', () => { overlay.hidden = false; });
  overlay.querySelector('.tutorial-close').addEventListener('click', closeTutorial);
  overlay.querySelector('.tutorial-done').addEventListener('click', closeTutorial);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeTutorial(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTutorial(); });

  // Small visual feedback while the wheel is being dragged.
  canvasWrap.addEventListener('pointerdown', () => canvasWrap.classList.add('is-dragging'));
  window.addEventListener('pointerup', () => canvasWrap.classList.remove('is-dragging'));
})();
