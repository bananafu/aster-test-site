---
layout: single
title: "About Me"
permalink: /about/
author_profile: false
---

{% raw %}
<style>
/* 去除單頁黑色 header 區塊（Minimal Mistakes 默認 .page__header） */
.page__header {
  display: none;
}

/* 照片樣式：陰影、圓角、模糊邊緣 */
.rounded-photo {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  border-radius: 18px;
  filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.2));
  margin-left: 2rem;
  max-width: 100%;
  height: auto;
}
</style>
{% endraw %}

<div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">

  <div style="flex: 1; min-width: 250px;">
    <p style="margin: 0;">Hello! I'm Aster 🌱</p>
    <p style="margin: 0;">I'm a student passionate about:</p>
    <ul style="color: #f8a34d; list-style: none; padding-left: 1em; margin: 0; line-height: 1.4;">
      <li>• Environmental simulation</li>
      <li>• Architectural design</li>
      <li>• Climate data visualization</li>
    </ul>
    <p style="margin: 0;">This page is still under construction. Stay tuned!</p>
  </div>

  <div style="flex: 0 0 200px;">
    <img src="{{ '/assets/images/photo.jpg' | relative_url }}" alt="Aster photo" style="max-width: 100%; height: auto;" />
  </div>

</div>
