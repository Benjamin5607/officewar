function useTouchUi() {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 820;
}

function syncTouchLayer(gameRunning) {
  const layer = document.getElementById("touch-controls");
  if (!layer) return;
  const show = gameRunning && useTouchUi();
  layer.classList.toggle("hidden", !show);
  layer.setAttribute("aria-hidden", show ? "false" : "true");
}

const GameCtor = window.OfficeWarGame;
if (typeof GameCtor !== "function") {
  const errDetail = typeof window.OfficeWarBootstrapError === "string" ? window.OfficeWarBootstrapError : "";
  document.body.innerHTML =
    `<p style="padding:24px;font-family:sans-serif;color:#fff;background:#0c1220;min-height:100vh;margin:0;max-width:640px;line-height:1.5">
게임 코드를 시작하지 못했습니다.<br /><br />
1) 브라우저에서 페이지 전체 폴더를 연 것인지 확인하세요. (<code>index.html</code>과 <code>js/</code>, <code>img/</code>가 같은 디렉터리에 있어야 합니다.)<br />
2) 개발자 도구(F12) → Console 에서 빨간 오류 메시지를 확인하세요.<br />
${errDetail ? `<br/><code style="word-break:break-all;font-size:12px;opacity:0.85">${errDetail}</code>` : ""}</p>`;
} else {
  const canvas = document.getElementById("game");
  const overlay = document.getElementById("overlay");
  const btnStart = document.getElementById("btn-start");
  const hudPhase = document.getElementById("hud-phase");
  const hudScore = document.getElementById("hud-score");
  const hudLives = document.getElementById("hud-lives");
  const hudBomb = document.getElementById("hud-bomb");
  const toast = document.getElementById("toast");
  const stickBase = document.getElementById("stick-base");
  const stickKnob = document.getElementById("stick-knob");
  const touchFire = document.getElementById("touch-fire");
  const touchBomb = document.getElementById("touch-bomb");
  const btnMale = document.getElementById("btn-male");
  const btnFemale = document.getElementById("btn-female");
  const btnLangKo = document.getElementById("btn-lang-ko");
  const btnLangEn = document.getElementById("btn-lang-en");
  const panelMenu = document.getElementById("panel-menu");
  const panelResults = document.getElementById("panel-results");
  const btnResultsHome = document.getElementById("btn-results-home");
  const btnResultsRetry = document.getElementById("btn-results-retry");

  /** @type {{ outcome: "win"|"lose"; score: number; kills: Record<string, number> } | null} */
  let lastResultsPayload = null;

  function showTitlePanelsOnly() {
    panelMenu?.classList.remove("hidden");
    panelResults?.classList.add("hidden");
    panelResults?.classList.remove("win", "lose");
  }

  function fillResultsFromPayload(payload) {
    if (!payload || !panelResults) return;
    const loc = game.getLocale();
    const pack = window.OfficeWarI18n?.[game.getLang()] ?? window.OfficeWarI18n?.ko ?? {};
    const ko = window.OfficeWarI18n?.ko ?? {};
    const tl = (k) => pack[k] ?? ko[k] ?? k;
    const headline = document.getElementById("results-headline");
    const killingCaption = document.getElementById("results-kills-caption");
    const scoreLabel = document.getElementById("results-score-label");
    const scoreVal = document.getElementById("results-score-value");
    const tbody = document.getElementById("results-kills-body");
    if (headline) headline.textContent = payload.outcome === "win" ? tl("resultWinTitle") : tl("resultLoseTitle");
    if (scoreLabel) scoreLabel.textContent = tl("resultScoreLabel");
    if (scoreVal) scoreVal.textContent = payload.score.toLocaleString(loc);
    if (killingCaption) killingCaption.textContent = tl("resultKillsCaption");
    if (btnResultsHome) btnResultsHome.textContent = tl("resultBtnHome");
    if (btnResultsRetry) btnResultsRetry.textContent = tl("resultBtnRetry");
    if (tbody) {
      tbody.replaceChildren();
      const kinds = window.OfficeWarKillKinds ?? [];
      for (const kind of kinds) {
        const row = document.createElement("tr");
        const tdName = document.createElement("td");
        tdName.textContent = tl("enemy_" + kind);
        const tdCt = document.createElement("td");
        tdCt.className = "results-count";
        tdCt.textContent = (payload.kills[kind] ?? 0).toLocaleString(loc);
        row.appendChild(tdName);
        row.appendChild(tdCt);
        tbody.appendChild(row);
      }
    }
  }

  const game = new GameCtor(canvas, {
    onHud: (state) => {
      const lang = game.getLang();
      const pack = window.OfficeWarI18n?.[lang] ?? window.OfficeWarI18n?.ko ?? {};
      const ko = window.OfficeWarI18n?.ko ?? {};
      const t = (k) => pack[k] ?? ko[k] ?? k;
      hudPhase.textContent = `${t("hudStage")} ${state.stageNum}/${state.stageTotal} · ${state.phaseLabel}`;
      const loc = game.getLocale();
      hudScore.textContent = `${t("hudScore")} ${state.score.toLocaleString(loc)}`;
      hudLives.textContent = `${t("hudLife")} ${"●".repeat(state.lives)}${"○".repeat(Math.max(0, 3 - state.lives))}`;
      hudBomb.textContent = `${t("hudBomb")} ×${state.bombs}${state.weaponLabel != null ? ` · ${state.weaponLabel}` : ""}`;
      syncTouchLayer(game.running);
    },
    onToast: (msg, ms) => {
      toast.textContent = msg;
      toast.classList.remove("hidden");
      clearTimeout(toast._t);
      toast._t = setTimeout(() => toast.classList.add("hidden"), ms);
    },
    onGameEnd: (payload) => {
      lastResultsPayload = payload;
      panelMenu?.classList.add("hidden");
      panelResults?.classList.remove("hidden");
      panelResults?.classList.toggle("win", payload.outcome === "win");
      panelResults?.classList.toggle("lose", payload.outcome === "lose");
      overlay?.classList.remove("hidden");
      syncTouchLayer(false);
      toast?.classList.add("hidden");
      fillResultsFromPayload(payload);
    },
  });

  function tr(k) {
    const lang = game.getLang();
    const pack = window.OfficeWarI18n?.[lang] ?? window.OfficeWarI18n?.ko ?? {};
    const ko = window.OfficeWarI18n?.ko ?? {};
    return pack[k] ?? ko[k] ?? k;
  }

  function applyOverlayLang() {
    document.documentElement.lang = game.getLang() === "en" ? "en" : "ko";
    const backLink = document.getElementById("arcade-back-link");
    if (backLink) backLink.textContent = game.getLang() === "en" ? "◀ ARCADE" : "◀ 오락실";
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    const title = tr("pageTitle");
    set("doc-title", title);
    document.title = title;
    set("ui-title", tr("title"));
    set("ui-tagline", tr("tagline"));
    set("ui-pick-lang", tr("pickLang"));
    set("ui-pick-char", tr("pickChar"));
    set("ui-keys", tr("keysHelp"));
    set("ui-hint", tr("hint"));
    if (btnStart) btnStart.textContent = tr("start");
    set("touch-hint-move", tr("touchMove"));
    set("touch-fire", tr("touchFire"));
    set("touch-bomb", tr("touchBomb"));
    if (btnLangKo) btnLangKo.textContent = tr("langKo");
    if (btnLangEn) btnLangEn.textContent = tr("langEn");
    const genderGroup = document.getElementById("ui-gender-group");
    if (genderGroup) genderGroup.setAttribute("aria-label", tr("genderGroupAria"));
    const langGroup = document.getElementById("ui-lang-group");
    if (langGroup) langGroup.setAttribute("aria-label", tr("langGroupAria"));
    if (btnMale) btnMale.textContent = tr("male");
    if (btnFemale) btnFemale.textContent = tr("female");
    if (lastResultsPayload && panelResults && !panelResults.classList.contains("hidden")) {
      fillResultsFromPayload(lastResultsPayload);
    }
  }

  function pickLang(which) {
    game.setLang(which);
    // keep the arcade-wide language choice in sync
    try {
      localStorage.setItem("owa_lang", which === "en" ? "en" : "ko");
    } catch (_) {}
    btnLangKo?.classList.toggle("selected", which === "ko");
    btnLangEn?.classList.toggle("selected", which === "en");
    btnLangKo?.setAttribute("aria-pressed", which === "ko" ? "true" : "false");
    btnLangEn?.setAttribute("aria-pressed", which === "en" ? "true" : "false");
    applyOverlayLang();
    game.pushHud();
  }

  function pickGender(which) {
    game.setPlayerGender(which);
    btnFemale?.classList.toggle("selected", which === "f");
    btnMale?.classList.toggle("selected", which === "m");
    btnFemale?.setAttribute("aria-pressed", which === "f" ? "true" : "false");
    btnMale?.setAttribute("aria-pressed", which === "m" ? "true" : "false");
    if (btnStart) btnStart.disabled = false;
  }

  btnLangKo?.addEventListener("click", () => pickLang("ko"));
  btnLangEn?.addEventListener("click", () => pickLang("en"));
  btnMale?.addEventListener("click", () => pickGender("m"));
  btnFemale?.addEventListener("click", () => pickGender("f"));

  btnResultsHome?.addEventListener("click", () => {
    showTitlePanelsOnly();
  });

  btnResultsRetry?.addEventListener("click", () => {
    overlay?.classList.add("hidden");
    showTitlePanelsOnly();
    game.start();
    syncTouchLayer(true);
    requestAnimationFrame(() => {
      canvas.focus({ preventScroll: true });
    });
  });

  let stickId = null;
  const maxStick = 44;

  function moveStick(clientX, clientY) {
    if (!stickBase || !stickKnob) return;
    const r = stickBase.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const m = Math.hypot(dx, dy);
    if (m > maxStick && m > 0) {
      dx = (dx / m) * maxStick;
      dy = (dy / m) * maxStick;
    }
    stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    const ax = maxStick > 0 ? dx / maxStick : 0;
    const ay = maxStick > 0 ? dy / maxStick : 0;
    game.setPointerAxes(ax, ay);
  }

  function resetStick() {
    stickId = null;
    if (stickKnob) stickKnob.style.transform = "translate(0px, 0px)";
    game.setPointerAxes(0, 0);
  }

  if (stickBase) {
    stickBase.addEventListener("pointerdown", (e) => {
      if (!game.running || game.paused) return;
      e.preventDefault();
      stickId = e.pointerId;
      stickBase.setPointerCapture(e.pointerId);
      moveStick(e.clientX, e.clientY);
    });
    stickBase.addEventListener("pointermove", (e) => {
      if (stickId !== e.pointerId) return;
      e.preventDefault();
      moveStick(e.clientX, e.clientY);
    });
    stickBase.addEventListener("pointerup", (e) => {
      if (stickId !== e.pointerId) return;
      e.preventDefault();
      try {
        stickBase.releasePointerCapture(e.pointerId);
      } catch (_) {}
      resetStick();
    });
    stickBase.addEventListener("pointercancel", () => resetStick());
  }

  function bindHoldFire(el) {
    if (!el) return;
    const down = (e) => {
      e.preventDefault();
      if (!game.running || game.paused) return;
      game.setPointerFire(true);
    };
    const up = (e) => {
      e.preventDefault();
      game.setPointerFire(false);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", up);
  }

  bindHoldFire(touchFire);

  if (touchBomb) {
    touchBomb.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!game.running || game.paused) return;
      game.triggerTouchBomb();
    });
  }

  btnStart?.addEventListener("click", () => {
    if (!btnStart || btnStart.disabled) return;
    showTitlePanelsOnly();
    overlay?.classList.add("hidden");
    game.start();
    syncTouchLayer(true);
    requestAnimationFrame(() => {
      canvas.focus({ preventScroll: true });
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape" && game.running) {
      e.preventDefault();
      game.togglePause();
    }
  });

  window.addEventListener("resize", () => {
    syncTouchLayer(game.running);
  });

  // adopt the arcade-wide language choice (set from the hub / other games)
  let initialLang = "ko";
  try {
    const s = localStorage.getItem("owa_lang");
    if (s === "ko" || s === "en") initialLang = s;
  } catch (_) {}
  try {
    pickLang(initialLang);
  } catch (e) {
    console.error("[OfficeWar] initial lang apply failed:", e);
  }
  window.OfficeWarAssets?.init?.();
  try {
    game.pushHud();
  } catch (e) {
    console.error("[OfficeWar] HUD init failed:", e);
  }

  overlay?.classList.remove("hidden");
  syncTouchLayer(false);
}
