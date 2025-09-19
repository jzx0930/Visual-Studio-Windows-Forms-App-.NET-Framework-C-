// ✅ 進場依序展開章節（一次性動畫）
window.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("section");

  sections.forEach((section, index) => {
    const header = section.querySelector("h2");
    const arrow = header.querySelector(".arrow");

    // 初始設為收合
    section.classList.add("collapsed");
    section.classList.remove("expanded");
    if (arrow) arrow.textContent = "▶";

    // 延遲依序展開（每個章節間隔 500ms）
    setTimeout(() => {
      section.classList.remove("collapsed");
      section.classList.add("expanded");
      if (arrow) arrow.textContent = "▼";
    }, index * 500);
  });
});

// ✅ 多段展開／收合章節（點擊後不影響其他章節）
document.querySelectorAll("section h2").forEach(header => {
  const arrow = header.querySelector(".arrow");
  header.style.cursor = "pointer";

  header.addEventListener("click", () => {
    const currentSection = header.parentElement;

    // 🔁 只切換目前章節，不收合其他章節
    const isCollapsed = currentSection.classList.contains("collapsed");
    currentSection.classList.toggle("collapsed", !isCollapsed);
    currentSection.classList.toggle("expanded", isCollapsed);
    arrow.textContent = isCollapsed ? "▼" : "▶";
  });
});