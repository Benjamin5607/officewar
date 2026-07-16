/* ===========================================================================
   Office War Arcade — shared i18n (KO / EN)
   - Language stored in localStorage("owa_lang"), shared across every page.
   - I18N.t(ko, en)      → pick a string for the current language
   - I18N.pick({ko,en})  → pick from an object (falls back to the other lang)
   - I18N.applyDom(root) → swap any element carrying data-en (and optional
                           data-ko) between languages. Original innerHTML is
                           captured as the Korean text on first apply.
   - A floating KO / EN toggle is injected on every page that loads this file
     (unless window.__noLangToggle is set before load).
   - Changing language persists the choice and reloads the page so both DOM
     and canvas-drawn text pick it up cleanly.
   =========================================================================== */
(function () {
  "use strict";
  const KEY = "owa_lang";
  let lang = "ko";
  try {
    const s = localStorage.getItem(KEY);
    if (s === "ko" || s === "en") lang = s;
  } catch (_) {}

  function get() {
    return lang;
  }
  function set(l) {
    l = l === "en" ? "en" : "ko";
    if (l === lang) return;
    try {
      localStorage.setItem(KEY, l);
    } catch (_) {}
    lang = l;
    location.reload();
  }
  function t(ko, en) {
    return lang === "en" ? (en == null ? ko : en) : ko;
  }
  function pick(v) {
    if (v && typeof v === "object" && ("ko" in v || "en" in v)) {
      return lang === "en" ? (v.en != null ? v.en : v.ko) : v.ko != null ? v.ko : v.en;
    }
    return v;
  }

  // Swap all [data-en] elements. innerHTML at first sight is treated as Korean.
  function applyDom(root) {
    root = root || document;
    const els = root.querySelectorAll("[data-en]");
    els.forEach((el) => {
      if (!el.hasAttribute("data-ko")) el.setAttribute("data-ko", el.innerHTML);
      el.innerHTML = lang === "en" ? el.getAttribute("data-en") : el.getAttribute("data-ko");
    });
    // attribute translations: data-en-placeholder etc. (rarely needed)
    root.querySelectorAll("[data-en-attr]").forEach((el) => {
      const spec = el.getAttribute("data-en-attr"); // "attr|english text"
      const idx = spec.indexOf("|");
      if (idx < 0) return;
      const attr = spec.slice(0, idx);
      const enVal = spec.slice(idx + 1);
      const koKey = "data-ko-attr-" + attr;
      if (!el.hasAttribute(koKey)) el.setAttribute(koKey, el.getAttribute(attr) || "");
      el.setAttribute(attr, lang === "en" ? enVal : el.getAttribute(koKey));
    });
  }

  function injectToggle() {
    if (window.__noLangToggle) return;
    if (document.getElementById("lang-toggle")) return;
    const box = document.createElement("div");
    box.id = "lang-toggle";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Language");
    box.innerHTML =
      '<button type="button" data-l="ko" aria-label="한국어">KO</button>' +
      '<button type="button" data-l="en" aria-label="English">EN</button>';
    const style = document.createElement("style");
    style.textContent = `
      #lang-toggle{position:fixed;top:8px;right:8px;z-index:10000;display:flex;
        font-family:"Press Start 2P","Galmuri11",monospace;box-shadow:0 3px 0 #000;border:2px solid #2f3a5c;}
      #lang-toggle button{font-family:inherit;font-size:11px;padding:7px 9px;border:0;cursor:pointer;
        background:#10131f;color:#7c86a5;line-height:1;}
      #lang-toggle button+button{border-left:2px solid #2f3a5c;}
      #lang-toggle button.on{background:#ffb638;color:#10131f;}
    `;
    document.head.appendChild(style);
    box.querySelectorAll("button").forEach((b) => {
      if (b.dataset.l === lang) b.classList.add("on");
      b.addEventListener("click", () => set(b.dataset.l));
    });
    document.body.appendChild(box);
  }

  window.I18N = { get, set, t, pick, applyDom };

  function boot() {
    document.documentElement.lang = lang === "en" ? "en" : "ko";
    injectToggle();
    applyDom(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
