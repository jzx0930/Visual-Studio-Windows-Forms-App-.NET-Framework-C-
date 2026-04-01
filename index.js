document.addEventListener("DOMContentLoaded", () => {
  initUIComponents();
});

/* =========================
   初始化所有 UI 元件
========================= */
function initUIComponents() {
  initSequentialSectionReveal();
  initSectionToggle();
  initCopyButtons();
}

/* =========================
   依序展開章節動畫（進場用）
========================= */
function initSequentialSectionReveal() {
  const sections = document.querySelectorAll("section");

  sections.forEach((section, index) => {
    const header = section.querySelector("h2");
    const arrow = header?.querySelector(".arrow");

    section.classList.add("collapsed");
    section.classList.remove("expanded");
    if (arrow) arrow.textContent = "▶";

    setTimeout(() => {
      section.classList.remove("collapsed");
      section.classList.add("expanded");
      if (arrow) arrow.textContent = "▼";
    }, index * 500);
  });
}

/* =========================
   點擊展開／收合章節（互動用）
========================= */
function initSectionToggle() {
  document.querySelectorAll("section h2").forEach(header => {
    const arrow = header.querySelector(".arrow");
    header.style.cursor = "pointer";

    header.addEventListener("click", () => {
      const section = header.parentElement;
      const isCollapsed = section.classList.contains("collapsed");
      section.classList.toggle("collapsed", !isCollapsed);
      section.classList.toggle("expanded", isCollapsed);
      if (arrow) arrow.textContent = isCollapsed ? "▼" : "▶";
    });
  });
}

/* =========================
   建立複製按鈕元件
========================= */
function createCopyButton(textSource) {
  const button = document.createElement("button");
  button.className = "copy-btn";
  button.textContent = "複製程式碼";

  button.addEventListener("click", () => {
    const text = typeof textSource === "string" ? textSource : textSource.innerText;
    navigator.clipboard.writeText(text);
    button.classList.add("copied");
    button.textContent = "已複製！";
    setTimeout(() => {
      button.classList.remove("copied");
      button.textContent = "複製程式碼";
    }, 2000);
  });

  return button;
}

/* =========================
   自動插入複製按鈕
========================= */
function initCopyButtons() {
  document.querySelectorAll("pre > code").forEach(codeBlock => {
    if (!codeBlock || !codeBlock.innerText.trim()) return;

    const pre = codeBlock.parentElement;
    const wrapper = pre.parentElement;

    const hasButton = wrapper.querySelector(".copy-btn");
    if (hasButton) return;

    const button = createCopyButton(codeBlock);
    wrapper.insertBefore(button, pre);
  });
}







































// 在 DOMContentLoaded 裡呼叫 initFileLoader()
document.addEventListener("DOMContentLoaded", () => {
  initUIComponents();
  initFileLoader(); // 新增：初始化檔案清單與事件
});

/* =========================
   檔案清單與載入功能
========================= */
function initFileLoader() {
  const select = document.getElementById("fileSelect");
  const btn = document.getElementById("btnLoadFile");

  // 載入 files.json（伺服器上準備的檔名清單）
  fetch("txt/files.json")
    .then(r => { if (!r.ok) throw new Error("files.json 讀取失敗"); return r.json(); })
    .then(list => {
      select.innerHTML = "";
      list.forEach((fn, idx) => {
        const opt = document.createElement("option");
        opt.value = fn;
        opt.textContent = fn;
        select.appendChild(opt);
      });
      // 預設載入第一個（可選）
      if (list.length) loadFileAndRender(list[0]);
    })
    .catch(err => console.error(err));

  // 按鈕與選單變更事件
  btn.addEventListener("click", () => {
    const fn = select.value;
    if (fn) loadFileAndRender(fn);
  });
  select.addEventListener("change", () => {
    // 若要改選就自動載入，取消註解下一行
    // if (select.value) loadFileAndRender(select.value);
  });
}

// 以檔名載入 txt 並呼叫渲染
function loadFileAndRender(filename) {
  fetch(`txt/${encodeURIComponent(filename)}`)
    .then(response => {
      if (!response.ok) throw new Error("檔案讀取失敗");
      return response.text();
    })
    .then(text => renderCardsFromText(text))
    .catch(err => {
      const container = document.getElementById("word-container") || document.body;
      container.innerHTML = "<p style='color:red'>讀取失敗：" + err.message + "</p>";
      console.error(err);
    });
}

// 將文字內容解析並建立字卡（可與你現有邏輯整合）
function renderCardsFromText(text) {
  const lines = text.split("\n").map(line => line.trim()).filter(line => line);
  const container = document.getElementById("word-container");
  if (!container) return;
  container.innerHTML = "";

  let section = null;
  let row = null;

  lines.forEach(line => {
    if (/^單字/.test(line)) {
      section = document.createElement("section");
      section.className = "collapsed";

      const title = document.createElement("div");
      title.className = "section-title";

      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = "▶";

      title.appendChild(arrow);
      title.appendChild(document.createTextNode(line));

      row = document.createElement("div");
      row.className = "content-row";

      title.addEventListener("click", () => {
        row.classList.toggle("collapsed");
        arrow.classList.toggle("rotate");
        // 同步箭頭字元
        arrow.textContent = arrow.classList.contains("rotate") ? "▼" : "▶";
      });

      section.appendChild(title);
      section.appendChild(row);
      container.appendChild(section);
    } else {
      const idx = line.indexOf("|");
      if (idx !== -1 && row) {
        const word = line.substring(0, idx).trim();
        const meaning = line.substring(idx + 1).trim();

        const card = document.createElement("div");
        card.className = "term-card";
        card.dataset.word = word;
        card.innerHTML = `
          <div class="main-text">
            <span class="word">${escapeHtml(word)}</span>
            <button class="speak-button" onclick="speakWord('${escapeHtmlJs(word)}','en-GB')">英式</button>
            <button class="speak-button" onclick="speakWord('${escapeHtmlJs(word)}','en-US')">美式</button>
            <button class="speak-button" onclick="repeatSpeak('${escapeHtmlJs(word)}','en-GB')">英式重播</button>
            <button class="speak-button" onclick="repeatSpeak('${escapeHtmlJs(word)}','en-US')">美式重播</button>
          </div>
          <div class="sub-text">${escapeHtml(meaning)}</div>
        `;
        row.appendChild(card);
      }
    }
  });
}

/* 安全輸出字串（防 XSS） */
function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "'");
}
/* 用於在 onclick 字串內的簡單 escape（單引號避掉） */
function escapeHtmlJs(s) {
  if (s == null) return "";
  return String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

















/* =========================
   多益單字網頁功能模組
========================= */

// 語音播放狀態暫存
const repeatStatus = {};

// 基礎發音功能
function speakWord(word, lang) {
    window.speechSynthesis.cancel();
    clearAllRepeatStatus();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
}

// 循環播放功能
function repeatSpeak(word, lang) {
    const key = word + lang;

    if (repeatStatus[key]) {
        window.speechSynthesis.cancel();
        repeatStatus[key] = false;
        return;
    }

    window.speechSynthesis.cancel();
    clearAllRepeatStatus();
    repeatStatus[key] = true;

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    utterance.onend = () => {
        if (repeatStatus[key]) window.speechSynthesis.speak(utterance);
    };
    window.speechSynthesis.speak(utterance);
}

function clearAllRepeatStatus() {
    for (const key in repeatStatus) {
        repeatStatus[key] = false;
    }
}

// 搜尋功能
function searchWord() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    if (!query) return;

    let found = false;
    document.querySelectorAll(".term-card").forEach(card => {
        const word = card.dataset.word.toLowerCase();
        const section = card.closest("section");
        const wordSpan = card.querySelector(".word");

        wordSpan.classList.remove("highlight");

        if (word.includes(query)) {
            found = true;
            section.classList.remove("collapsed");
            section.classList.add("expanded");
            const arrow = section.querySelector(".arrow");
            if (arrow) arrow.textContent = "▼";

            wordSpan.classList.add("highlight");
            card.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });

    if (!found) alert("找不到該單字！");
}

// 全部展開/收合
function expandAll() {
    document.querySelectorAll("section").forEach(section => {
        section.classList.remove("collapsed");
        section.classList.add("expanded");
        const arrow = section.querySelector(".arrow");
        if (arrow) arrow.textContent = "▼";
    });
}

function collapseAll() {
    document.querySelectorAll("section").forEach(section => {
        section.classList.remove("expanded");
        section.classList.add("collapsed");
        const arrow = section.querySelector(".arrow");
        if (arrow) arrow.textContent = "▶";
    });
}
