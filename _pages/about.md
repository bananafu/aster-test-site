---
layout: single
title: "About Me"
permalink: /about/
author_profile: true
---

<style>
.page {
  background-image: url('{{ "/assets/images/9-3.jpg" | relative_url }}');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: #fff; /* 若背景圖深色，字改白色 */
  padding: 2rem;
}
.page ul li {
  color: #ffd699; /* 調整重點色字體可見度 */
}
.page img {
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  border-radius: 12px;
}
</style>

<div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">

  <div style="flex: 1; min-width: 250px;">
    <p style="margin: 0;">Hello! I'm Aster 🌱</p>
    <p style="margin: 0;">I'm a student passionate about:</p>
    <ul style="list-style: none; padding-left: 1em; margin: 0; line-height: 1.4;">
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
