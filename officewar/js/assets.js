/**
 * Raster PNG sprites: load as Image and draw as-is (no canvas / no resample).
 */
(function () {
  const cache = /** @type {Record<string, { img: CanvasImageSource; w: number; h: number }>} */ ({});

  /** Bump when replacing img/*.png so browsers don't keep stale raster cache. */
  const RASTER_VER = "v=20260516raw";

  const RASTER_URLS = /** @type {Record<string, string>} */ ({
    backdrop_day: "img/bg-day.png?" + RASTER_VER,
    backdrop_crunch: "img/bg-crunch.png?" + RASTER_VER,
    player_m: "img/player-m.png?" + RASTER_VER,
    player_f: "img/player-f.png?" + RASTER_VER,
    enemy_postit: "img/enemy-postit.png?" + RASTER_VER,
    enemy_mail: "img/enemy-mail.png?" + RASTER_VER,
    enemy_meeting: "img/enemy-meeting.png?" + RASTER_VER,
    enemy_report: "img/enemy-report.png?" + RASTER_VER,
    enemy_ticket: "img/enemy-ticket.png?" + RASTER_VER,
    enemy_expense: "img/enemy-expense.png?" + RASTER_VER,
    enemy_slack: "img/enemy-slack.png?" + RASTER_VER,
    enemy_approval: "img/enemy-approval.png?" + RASTER_VER,
    enemy_printer: "img/enemy-printer.png?" + RASTER_VER,
    enemy_boss: "img/enemy-boss.png?" + RASTER_VER,
  });

  /** On-screen max bounding box dimension (pixels) (~+30%) */
  const SCREEN_MAX = /** @type {Record<string, number>} */ ({
    player_m: 131,
    player_f: 131,
    enemy_postit: 91,
    enemy_mail: 98,
    enemy_meeting: 108,
    enemy_report: 95,
    enemy_ticket: 94,
    enemy_expense: 96,
    enemy_slack: 99,
    enemy_approval: 101,
    enemy_printer: 122,
    enemy_boss: 148,
    bullet_coin: 22,
    bullet_doc: 20,
    bullet_alert: 22,
    bullet_ally: 24,
    bullet_mail: 22,
    bullet_cal: 22,
    bullet_bolt: 20,
    bullet_paper: 20,
    bullet_keyboard: 28,
    bullet_mouse: 30,
    bomb_icon: 40,
  });

  function enc(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.trim());
  }

  function loadSvg(svg, w, h) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ img, w, h });
      img.onerror = reject;
      img.src = enc(svg);
    });
  }

  function loadRaster(key, url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        cache[key] = { img, w: img.naturalWidth, h: img.naturalHeight };
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  const SVGS = {
    player_m: {
      w: 88,
      h: 108,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 108"><circle cx="44" cy="54" r="36" fill="#475569"/><circle cx="44" cy="48" r="28" fill="#94a3b8"/></svg>`,
    },
    player_f: {
      w: 88,
      h: 108,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 108"><circle cx="44" cy="54" r="36" fill="#831843"/><circle cx="44" cy="48" r="28" fill="#f9a8d4"/></svg>`,
    },
    enemy_postit: { w: 72, h: 88, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 88"><rect x="14" y="18" width="44" height="52" rx="8" fill="#fbbf24" stroke="#b45309"/></svg>` },
    enemy_mail: { w: 80, h: 88, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 88"><path d="M10 36 L40 18 L70 36 V72 H10 Z" fill="#f1f5f9" stroke="#64748b"/></svg>` },
    enemy_meeting: { w: 96, h: 80, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 80"><rect x="14" y="12" width="68" height="56" rx="8" fill="#1e293b"/></svg>` },
    enemy_report: { w: 76, h: 92, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 92"><rect x="22" y="10" width="32" height="60" rx="4" fill="#e2e8f0"/></svg>` },
    enemy_ticket: { w: 76, h: 92, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 92"><rect x="18" y="16" width="40" height="52" rx="8" fill="#ede9fe" stroke="#7c3aed"/></svg>` },
    enemy_expense: { w: 74, h: 92, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 74 92"><path d="M16 22 H58 L54 76 H20 Z" fill="#fefce8" stroke="#a8a29e"/></svg>` },
    enemy_slack: { w: 78, h: 88, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 88"><rect x="14" y="18" width="50" height="44" rx="14" fill="#581c87"/></svg>` },
    enemy_approval: { w: 78, h: 94, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 94"><rect x="22" y="12" width="34" height="58" rx="4" fill="#fff" stroke="#94a3b8"/><circle cx="39" cy="34" r="10" fill="#dc2626"/></svg>` },
    enemy_printer: { w: 112, h: 96, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 96"><rect x="26" y="14" width="60" height="68" rx="10" fill="#475569"/></svg>` },
    enemy_boss: { w: 128, h: 128, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="48" fill="#312e81"/></svg>` },
    bullet_ally: {
      w: 24,
      h: 32,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32"><path d="M12 2 L16 14 L12 30 L8 14 Z" fill="#34d399"/></svg>`,
    },
    bullet_keyboard: {
      w: 36,
      h: 22,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 22"><rect x="1" y="4" width="34" height="15" rx="2" fill="#1e293b" stroke="#64748b"/><rect x="3" y="6" width="6" height="4" rx="1" fill="#94a3b8"/><rect x="11" y="6" width="6" height="4" rx="1" fill="#94a3b8"/><rect x="19" y="6" width="6" height="4" rx="1" fill="#cbd5e1"/><rect x="27" y="6" width="7" height="4" rx="1" fill="#64748b"/></svg>`,
    },
    bullet_mouse: {
      w: 26,
      h: 34,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 34"><ellipse cx="13" cy="4" rx="7" ry="3.5" fill="#475569"/><path d="M13 8 C7 8 5 13 5 21 C5 31 21 31 21 21 C21 13 19 8 13 8 Z" fill="#cbd5e1" stroke="#475569" stroke-width="1.2"/><path d="M13 13 L13 17" stroke="#64748b" stroke-width="1.4"/><path d="M9 26 L13 34 L17 26" fill="#475569"/><circle cx="10" cy="15" r="1.2" fill="#334155"/><circle cx="16" cy="15" r="1.2" fill="#334155"/></svg>`,
    },
    bullet_coin: { w: 28, h: 28, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="#fbbf24"/></svg>` },
    bullet_mail: {
      w: 32,
      h: 24,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 24"><rect x="2" y="4" width="28" height="16" rx="2" fill="#f8fafc" stroke="#64748b"/></svg>`,
    },
    bullet_doc: { w: 24, h: 28, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28"><path d="M4 2 H14 L20 8 V26 H4 Z" fill="#f8fafc" stroke="#64748b"/></svg>` },
    bullet_alert: { w: 28, h: 28, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><path d="M14 2 L26 24 H2 Z" fill="#ef4444"/></svg>` },
    bullet_cal: {
      w: 28,
      h: 28,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect x="3" y="4" width="22" height="20" rx="3" fill="#f8fafc" stroke="#475569"/><rect x="3" y="4" width="22" height="6" fill="#2563eb"/></svg>`,
    },
    bullet_paper: { w: 26, h: 30, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 30"><rect x="4" y="2" width="18" height="24" fill="#fff8" stroke="#94a3b8"/></svg>` },
    bullet_bolt: {
      w: 24,
      h: 28,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28"><path d="M14 0 L4 14 H10 L8 28 L20 12 H14 Z" fill="#eab308"/></svg>`,
    },
    bomb_icon: {
      w: 64,
      h: 64,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="38" r="16" fill="#475569"/><text x="32" y="42" text-anchor="middle" font-size="11" fill="#fff" font-weight="800">BOMB</text></svg>`,
    },
  };

  const BULLET_STYLE_MAP = {
    coin: "bullet_coin",
    stamp: "bullet_doc",
    code: "bullet_bolt",
    heart: "bullet_doc",
    funnel: "bullet_doc",
    lock: "bullet_alert",
    grid: "bullet_doc",
    bolt: "bullet_bolt",
    mail: "bullet_mail",
    alert: "bullet_alert",
    cal: "bullet_cal",
    pixel: "bullet_bolt",
    pto: "bullet_cal",
    cross: "bullet_alert",
    paper: "bullet_paper",
    blob: "bullet_paper",
    keys: "bullet_keyboard",
    mouse: "bullet_mouse",
    ring: "bullet_bolt",
    clip: "bullet_doc",
    wifi: "bullet_bolt",
    ghost: "bullet_mail",
    doc: "bullet_doc",
    ally: "bullet_ally",
  };

  const ENEMY_KIND_MAP = {
    postit: "enemy_postit",
    mail: "enemy_mail",
    meeting: "enemy_meeting",
    report: "enemy_report",
    ticket: "enemy_ticket",
    expense: "enemy_expense",
    slack: "enemy_slack",
    approval: "enemy_approval",
    printer: "enemy_printer",
    boss: "enemy_boss",
  };

  let ready = false;
  /** @type {Promise<void>|null} */
  let loading = null;

  function backdropKey(theme) {
    return theme === "crunch" || theme === "night" || theme === "evening" ? "backdrop_crunch" : "backdrop_day";
  }

  /** @param {CanvasRenderingContext2D} c @param {number} W @param {number} H @param {string} theme @param {number} t */
  function drawBackdrop(c, W, H, theme, t) {
    const key = backdropKey(theme);
    const s = cache[key];
    if (!s) return false;
    const iw = s.w;
    const ih = s.h;
    const scale = Math.max(W / iw, H / ih) * 1.06;
    const dw = iw * scale;
    const dh = ih * scale;
    const ox = (W - dw) / 2 + Math.sin(t * 0.05) * 6;
    const oy = (H - dh) / 2 + Math.sin(t * 0.12) * 10;
    c.save();
    c.drawImage(s.img, ox, oy, dw, dh);
    const dim = theme === "dusk" || theme === "afternoon" ? 0.14 : theme === "noon" || theme === "morning" ? 0.08 : theme === "crunch" ? 0.1 : 0.05;
    c.fillStyle = `rgba(15,23,42,${dim})`;
    c.fillRect(0, 0, W, H);
    c.restore();
    return true;
  }

  async function init() {
    if (ready) return;
    if (loading) return loading;
    loading = (async () => {
      try {
        await Promise.all(Object.entries(RASTER_URLS).map(([k, url]) => loadRaster(k, url)));
      } catch (_) {}
      try {
        for (const [key, def] of Object.entries(SVGS)) {
          if (!cache[key]) cache[key] = await loadSvg(def.svg, def.w, def.h);
        }
      } catch (_) {}
      ready = true;
    })();
    return loading;
  }

  /** @returns {number} Multiply so max(w,h)×scale ≈ SCREEN_MAX[key] px (no key → svgFallbackScale) */
  function scaleToTarget(key, svgFallbackScale = 0.75) {
    const s = cache[key];
    if (!s?.w || !s.h) return svgFallbackScale;
    const target = SCREEN_MAX[key];
    if (typeof target !== "number") return svgFallbackScale;
    return target / Math.max(s.w, s.h);
  }

  function draw(c, key, x, y, scale, alpha = 1, rot = 0) {
    const s = cache[key];
    if (!s) return false;
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y);
    if (rot) c.rotate(rot);
    c.scale(scale, scale);
    c.drawImage(s.img, -s.w / 2, -s.h / 2, s.w, s.h);
    c.restore();
    return true;
  }

  function spriteForEnemy(kind) {
    return ENEMY_KIND_MAP[kind] || "enemy_postit";
  }

  function spriteForBullet(style, ally) {
    if (ally) {
      if (!style || style === "ally") return "bullet_ally";
      return BULLET_STYLE_MAP[style] || "bullet_ally";
    }
    return BULLET_STYLE_MAP[style] || "bullet_doc";
  }

  function enemyScale(kind) {
    const key = spriteForEnemy(kind);
    return scaleToTarget(key, kind === "boss" ? 0.52 : 0.62);
  }

  /** Match main.js touch layer: coarse pointer or narrow viewport. */
  function isMobilePlayfield() {
    try {
      return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 820;
    } catch (_) {
      return typeof window.innerWidth === "number" && window.innerWidth <= 820;
    }
  }

  /** Extra player size on phones (visual + hitbox); was 3×, halved per mobile tuning. */
  const PLAYER_MOBILE_MUL = 1.5;

  function playerRadiusMul() {
    return isMobilePlayfield() ? PLAYER_MOBILE_MUL : 1;
  }

  function playerScale(gender) {
    const key = gender === "f" ? "player_f" : "player_m";
    const base = scaleToTarget(key, 0.82);
    return base * playerRadiusMul();
  }

  window.OfficeWarAssets = {
    init,
    get ready() {
      return ready;
    },
    draw,
    scaleToTarget,
    drawBackdrop,
    backdropKey,
    spriteForEnemy,
    spriteForBullet,
    enemyScale,
    playerScale,
    playerRadiusMul,
  };
})();
