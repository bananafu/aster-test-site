# Aster 互動式星座盤

## 檔案結構

```text
tools/
└─ star-wheel/
   ├─ index.html
   ├─ style.css
   └─ app.js
```

## 本機預覽

直接開啟 `index.html` 即可。若瀏覽器限制本機 JavaScript，可在此資料夾開啟終端機：

```bash
python -m http.server 8000
```

接著開啟：

```text
http://localhost:8000
```

## 上傳至網站

把整個 `star-wheel` 資料夾放進網站的 `tools` 資料夾：

```text
aster-test-site/tools/star-wheel/
```

上傳後網址會是：

```text
https://asterfu.tw/tools/star-wheel/
```

## 首頁 Tools 卡片

在首頁 `index.html` 的 `<section class="tools section" id="tools">` 中，
將以下卡片放在 Planet Grouping 卡片之後：

```html
<a class="tool-card" href="/tools/star-wheel/" aria-label="Open Interactive Star Wheel">
  <div class="tool-orbit star-wheel-icon" aria-hidden="true"><span></span></div>
  <div class="tool-content">
    <p class="tool-category">Earth Science · Astronomy</p>
    <h3>Interactive Star Wheel</h3>
    <p>Adjust the date and time to explore how constellations move across Taiwan's night sky.</p>
    <div class="tags tool-tags">
      <span>Interactive</span>
      <span>Constellations</span>
      <span>Classroom</span>
    </div>
  </div>
  <span class="tool-arrow" aria-hidden="true">↗</span>
</a>
```

目前首頁 `.tools-layout` 若只適合一張卡片，可先直接把新卡片接在原卡片後方。
若版面變擠，再於 `assets/css/custom.css` 加入：

```css
.tools-layout {
  align-items: start;
}

.tools-layout > .tool-card {
  margin-bottom: 18px;
}
```

## 教學提醒

這一版是視覺化教學模型，呈現日期與時間造成的星空旋轉規律。
若後續需要精確計算任意地點的星體高度角、方位角與升落時間，
應加入專業天文計算函式庫與完整星表資料。
