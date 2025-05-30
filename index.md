---
layout: custom_home
title: "Architecture X Climate"
permalink: /
---

<!-- Hero 標題區 -->
<div class="wide-content">
  <div class="hero-title">
    <h1>Architecture X Climate</h1>
    <p>I can make the architecture design more scientific!</p>
  </div>
</div>


---

<h2 id="-skills--tools">🧰 Skills & Tools</h2>

.skills-grid {
  display: flex;
  flex-wrap: wrap;        /* ✅ 可換行 */
  justify-content: center;
  gap: 2rem;
  padding: 1rem 0;
}

.skills-grid > div {
  flex: 0 0 150px;         /* ✅ 固定寬度讓它橫排 */
  text-align: center;
}

<div class="skills-grid">
  <div>
    <img src="{{ '/assets/images/energyplus.png' | relative_url }}" alt="EnergyPlus logo" style="height:50px;" />
    <p>EnergyPlus</p>
  </div>
  <div>
    <img src="{{ '/assets/images/ladybug.png' | relative_url }}" alt="Ladybug Tools logo" style="height:50px;" />
    <p>Ladybug Tools</p>
  </div>
  <div>
    <img src="{{ '/assets/images/cfd.png' | relative_url }}" alt="CFD logo" style="height:50px;" />
    <p>CFD</p>
  </div>
</div>

---

## ✨ About This Site

This site showcases my learning journey in:

- Building simulation  
- Indoor environmental control  
- Climate data visualization  
- Sustainable architecture

---

<!-- 快速連結區 -->
<p class="quick-links">
  📬 <a href="{{ '/contact/' | relative_url }}">Contact Me</a> ｜ 💼 <a href="{{ '/about/' | relative_url }}">About</a>
</p>
