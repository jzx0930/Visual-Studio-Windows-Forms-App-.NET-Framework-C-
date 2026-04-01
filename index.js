document.addEventListener("DOMContentLoaded", () => {
    initUIComponents();
    initFileLoader(); // 啟動時自動載入
});

/* =========================
   1. 初始化 UI 組件
========================= */
function initUIComponents() {
    // 這裡可以放你原有的 initSequentialSectionReveal 等...
}

/* =========================
   2. 檔案載入與解析 (核心)
========================= */
function initFileLoader() {
    const select = document.getElementById("fileSelect");
    const btn = document.getElementById("btnLoadFile");
    const fallbackList = ["單字.txt"]; // 預設檔案名稱

    // 嘗試讀取檔案清單
    fetch("txt/files.json")
        .then(r => r.json())
        .then(list => {
            renderSelectOptions(list);
            if (list.length) loadFileAndRender(list[0]);
        })
        .catch(() => {
            // 如果沒有 files.json，就用 fallback 名單
            renderSelectOptions(fallbackList);
            loadFileAndRender(fallbackList[0]);
        });

    if (btn) {
        btn.addEventListener("click", () => {
            const fn = select.value;
            if (fn) loadFileAndRender(fn);
        });
    }
}

function renderSelectOptions(list) {
    const select = document.getElementById("fileSelect");
    if (!select) return;
    select.innerHTML = "";
    list.forEach(fn => {
        const opt = document.createElement("option");
        opt.value = fn;
        opt.textContent = fn;
        select.appendChild(opt);
    });
}

function loadFileAndRender(filename) {
    fetch(`txt/${encodeURIComponent(filename)}`)
        .then(r => { if (!r.ok) throw new Error("讀取失敗"); return r.text(); })
        .then(text => renderCardsFromText(text))
        .catch(err => {
            document.getElementById("word-container").innerHTML = `<p style='color:red'>讀取失敗：${err.message}</p>`;
        });
}

/* =========================
   3. 渲染字卡邏輯
========================= */
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
            section.className = "expanded"; // 預設展開

            const title = document.createElement("div");
            title.className = "section-title";
            title.innerHTML = `<span class="arrow rotate">▼</span>${escapeHtml(line)}`;

            row = document.createElement("div");
            row.className = "content-row";

            title.addEventListener("click", () => {
                row.classList.toggle("collapsed");
                const arrow = title.querySelector(".arrow");
                arrow.classList.toggle("rotate");
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
                        <div style="margin-top:8px;">
                            <button class="speak-button" onclick="speakWord('${escapeJs(word)}','en-GB')">英</button>
                            <button class="speak-button" onclick="speakWord('${escapeJs(word)}','en-US')">美</button>
                            <button class="speak-button" onclick="repeatSpeak('${escapeJs(word)}','en-GB')">英重播</button>
                            <button class="speak-button" onclick="repeatSpeak('${escapeJs(word)}','en-US')">美重播</button>
                        </div>
                    </div>
                    <div class="sub-text">${escapeHtml(meaning)}</div>
                `;
                row.appendChild(card);
            }
        }
    });
}

/* =========================
   4. 功能函數 (搜尋、語音)
========================= */
const repeatStatus = {};

function speakWord(word, lang) {
    speechSynthesis.cancel();
    clearAllRepeatStatus();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
}

function repeatSpeak(word, lang) {
    const key = word + lang;
    if (repeatStatus[key]) {
        speechSynthesis.cancel();
        repeatStatus[key] = false;
        return;
    }
    speechSynthesis.cancel();
    clearAllRepeatStatus();
    repeatStatus[key] = true;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    utterance.onend = () => { if (repeatStatus[key]) speechSynthesis.speak(utterance); };
    speechSynthesis.speak(utterance);
}

function clearAllRepeatStatus() {
    for (const k in repeatStatus) repeatStatus[k] = false;
}

function searchWord() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    if (!query) return;
    let found = false;
    document.querySelectorAll(".term-card").forEach(card => {
        const word = card.dataset.word.toLowerCase();
        const wordSpan = card.querySelector(".word");
        wordSpan.classList.remove("highlight");
        if (word.includes(query)) {
            found = true;
            const section = card.closest("section");
            section.querySelector(".content-row").classList.remove("collapsed");
            section.querySelector(".arrow").textContent = "▼";
            section.querySelector(".arrow").classList.add("rotate");
            wordSpan.classList.add("highlight");
            card.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });
    if (!found) alert("找不到該單字！");
}

function expandAll() {
    document.querySelectorAll(".content-row").forEach(r => r.classList.remove("collapsed"));
    document.querySelectorAll(".arrow").forEach(a => { a.textContent = "▼"; a.classList.add("rotate"); });
}

function collapseAll() {
    document.querySelectorAll(".content-row").forEach(r => r.classList.add("collapsed"));
    document.querySelectorAll(".arrow").forEach(a => { a.textContent = "▶"; a.classList.remove("rotate"); });
}

function escapeHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function escapeJs(s) { return s.replace(/'/g, "\\'"); }
