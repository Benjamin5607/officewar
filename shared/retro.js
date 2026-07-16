/* ===========================================================================
   Office War Arcade — shared runtime helpers
   - Pixel-art canvas helpers (draw from a string "grid" of characters)
   - Tiny WebAudio beeper for retro SFX (no asset files needed)
   =========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Pixel sprite from ASCII grid.
     Each row is a string, each char maps to a color in `palette`.
     " " (space) or "." = transparent.
     Returns an offscreen canvas you can drawImage() at any integer scale.
     --------------------------------------------------------------------- */
  function makeSprite(rows, palette, scale = 1) {
    const h = rows.length;
    const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const cv = document.createElement("canvas");
    cv.width = w * scale;
    cv.height = h * scale;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === " " || ch === ".") continue;
        const col = palette[ch];
        if (!col) continue;
        c.fillStyle = col;
        c.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return cv;
  }

  function drawSprite(ctx, sprite, x, y, scale = 1) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(x0(sprite), 0, 0, sprite.width, sprite.height, x | 0, y | 0, (sprite.width / (sprite._base || 1)) * scale, (sprite.height / (sprite._base || 1)) * scale);
  }
  function x0(s) {
    return s;
  }

  /* Simple filled pixel rect helper honoring device pixels */
  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  /* Draw chunky pixel text using the canvas font but snapped + no smoothing */
  function pixelText(ctx, text, x, y, size, color, align = "left") {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    ctx.fillText(text, x | 0, y | 0);
    ctx.restore();
  }

  /* ---------------------------------------------------------------------
     Retro beeper — square/tri waves. Lazily created on first user gesture.
     --------------------------------------------------------------------- */
  let AC = null;
  function ctxAudio() {
    if (AC === null) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) {
        AC = false;
      }
    }
    if (AC && AC.state === "suspended") AC.resume().catch(() => {});
    return AC || null;
  }

  function beep(freq = 440, dur = 0.08, type = "square", gain = 0.05) {
    const ac = ctxAudio();
    if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dur);
  }

  const sfx = {
    select: () => beep(660, 0.05, "square", 0.05),
    confirm: () => {
      beep(523, 0.06);
      setTimeout(() => beep(784, 0.09), 60);
    },
    hit: () => beep(180, 0.09, "sawtooth", 0.06),
    hurt: () => beep(110, 0.16, "sawtooth", 0.07),
    coin: () => {
      beep(988, 0.05);
      setTimeout(() => beep(1319, 0.09), 55);
    },
    wrong: () => beep(140, 0.22, "square", 0.05),
    win: () => {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12), i * 90));
    },
    lose: () => {
      [400, 320, 240, 160].forEach((f, i) => setTimeout(() => beep(f, 0.16, "sawtooth", 0.06), i * 120));
    },
    step: () => beep(300, 0.03, "square", 0.03),
  };

  /* rAF game loop helper with fixed dt clamp */
  function loop(update, render) {
    let last = performance.now();
    let raf = 0;
    let running = true;
    function frame(now) {
      if (!running) return;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      update(dt);
      render();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return {
      stop() {
        running = false;
        cancelAnimationFrame(raf);
      },
    };
  }

  /* Fit a canvas' internal resolution to CSS size while staying crisp */
  function fitCanvas(canvas, targetW, targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function randInt(a, b) {
    return Math.floor(rand(a, b + 1));
  }
  function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  window.Retro = {
    makeSprite,
    drawSprite,
    px,
    pixelText,
    beep,
    sfx,
    loop,
    fitCanvas,
    rand,
    randInt,
    choice,
    clamp,
  };
})();
