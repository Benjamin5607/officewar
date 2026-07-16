/* 서류 대소동 — 3 office puzzle mini-games (sorting / spot-the-difference / quiz) */
(function () {
  "use strict";
  const R = window.Retro;
  const T = window.I18N;
  const L = (ko, en) => (T ? T.t(ko, en) : ko);
  const EN = () => T && T.get() === "en";
  const $ = (id) => document.getElementById(id);

  const screens = {
    menu: $("screen-menu"),
    sort: $("screen-sort"),
    diff: $("screen-diff"),
    quiz: $("screen-quiz"),
  };
  let activeLoop = null;
  let activeCleanup = null;

  function show(name) {
    if (activeLoop) {
      activeLoop.stop();
      activeLoop = null;
    }
    if (activeCleanup) {
      activeCleanup();
      activeCleanup = null;
    }
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));
    if (name === "sort") startSort();
    if (name === "diff") startDiff();
    if (name === "quiz") startQuiz();
  }

  document.querySelectorAll("[data-go]").forEach((b) =>
    b.addEventListener("click", () => {
      R.sfx.confirm();
      show(b.dataset.go);
    })
  );
  document.querySelectorAll("[data-back]").forEach((b) =>
    b.addEventListener("click", () => {
      R.sfx.select();
      show("menu");
    })
  );

  /* ==================== 1. 서류 터뜨리기 (Puyo-style) ====================
     Document pairs fall down a grid. Move / rotate / drop them. When 3+ of the
     SAME document type connect (4-directionally) they POP — clearing space and
     triggering chain combos. Survive as the stack rises. */
  const DOC_TYPES = [
    { key: "hr", color: "#ff5db1", shape: "circle" }, // 인사
    { key: "acc", color: "#ffb638", shape: "square" }, // 회계
    { key: "dev", color: "#43d9e6", shape: "triangle" }, // 개발
    { key: "law", color: "#46e07a", shape: "diamond" }, // 법무
  ];

  function startSort() {
    const cv = $("sort-canvas");
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    const W = cv.width,
      H = cv.height;
    const COLS = 6,
      ROWS = 12,
      CELL = 40;
    const offX = (W - COLS * CELL) / 2, // 120
      offY = (H - ROWS * CELL) / 2; // 20
    const NT = DOC_TYPES.length;
    const OFF = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]; // b position relative to axis by orient (up/right/down/left)

    let grid, piece, next, score, level, totalCleared, chain, over, state, fallTimer, softDrop, moveDir, dasTimer, resolveTimer, flashes, banner, bannerT;

    const newGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const rt = () => R.randInt(0, NT - 1);
    const genPiece = () => ({ a: rt(), b: rt() });
    const curFall = () => Math.max(0.14, 0.82 - (level - 1) * 0.06);

    function cellsOf(p) {
      const o = OFF[p.orient];
      return [
        { r: p.row, c: p.col, t: p.a },
        { r: p.row + o[0], c: p.col + o[1], t: p.b },
      ];
    }
    function valid(cells) {
      return cells.every((x) => x.c >= 0 && x.c < COLS && x.r >= 0 && x.r < ROWS && grid[x.r][x.c] === null);
    }
    function spawnPiece() {
      piece = { col: 2, row: 1, orient: 0, a: next.a, b: next.b };
      next = genPiece();
      if (!valid(cellsOf(piece))) {
        gameOver();
        return false;
      }
      return true;
    }
    function move(dc) {
      if (state !== "control" || !piece) return;
      const np = { ...piece, col: piece.col + dc };
      if (valid(cellsOf(np))) piece = np;
    }
    function doRotate() {
      if (state !== "control" || !piece) return;
      const kicks = [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
        [-1, -1],
        [1, -1],
      ];
      const no = (piece.orient + 1) % 4;
      for (const [dc, dr] of kicks) {
        const np = { ...piece, orient: no, col: piece.col + dc, row: piece.row + dr };
        if (valid(cellsOf(np))) {
          piece = np;
          R.sfx.select();
          return;
        }
      }
    }
    function stepDown() {
      if (!piece) return false;
      const np = { ...piece, row: piece.row + 1 };
      if (valid(cellsOf(np))) {
        piece = np;
        return true;
      }
      lock();
      return false;
    }
    function hardDrop() {
      if (state !== "control") return;
      while (stepDown()) {}
    }
    function lock() {
      for (const cell of cellsOf(piece)) if (cell.r >= 0) grid[cell.r][cell.c] = cell.t;
      piece = null;
      R.sfx.hit();
      applyGravity();
      state = "resolve";
      resolveTimer = 0.08;
      chain = 0;
    }
    function applyGravity() {
      for (let x = 0; x < COLS; x++) {
        const stack = [];
        for (let y = ROWS - 1; y >= 0; y--) if (grid[y][x] !== null) stack.push(grid[y][x]);
        for (let y = ROWS - 1, i = 0; y >= 0; y--) grid[y][x] = i < stack.length ? stack[i++] : null;
      }
    }
    function findGroups() {
      const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
      const groups = [];
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (grid[y][x] === null || seen[y][x]) continue;
          const t = grid[y][x];
          const stack = [[y, x]];
          const grp = [];
          seen[y][x] = true;
          while (stack.length) {
            const [cy, cx] = stack.pop();
            grp.push({ x: cx, y: cy });
            for (const [dy, dx] of [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ]) {
              const ny = cy + dy,
                nx = cx + dx;
              if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && !seen[ny][nx] && grid[ny][nx] === t) {
                seen[ny][nx] = true;
                stack.push([ny, nx]);
              }
            }
          }
          if (grp.length >= 3) groups.push(grp);
        }
      }
      return groups;
    }
    function resolveStep() {
      const groups = findGroups();
      if (groups.length) {
        chain++;
        let cleared = 0;
        for (const g of groups)
          for (const cell of g) {
            flashes.push({ x: cell.x, y: cell.y, color: DOC_TYPES[grid[cell.y][cell.x]].color, t: 0.32 });
            grid[cell.y][cell.x] = null;
            cleared++;
          }
        const gain = cleared * 10 * chain + (groups.length > 1 ? groups.length * 30 : 0);
        score += gain;
        totalCleared += cleared;
        level = 1 + Math.floor(totalCleared / 15);
        R.sfx.coin();
        if (chain >= 2) {
          banner = L(`체인 x${chain}!  +${gain}`, `CHAIN x${chain}!  +${gain}`);
          bannerT = 1.0;
        }
        applyGravity();
        resolveTimer = 0.3;
      } else {
        chain = 0;
        if (spawnPiece()) {
          state = "control";
          fallTimer = curFall();
        }
      }
    }
    function gameOver() {
      over = true;
      state = "over";
      R.sfx.lose();
      $("sort-msg").textContent = L(`꽉 찼다! 최종 점수 ${score}점 · Lv ${level} · 메뉴에서 재도전`, `Stacked out! Final score ${score} · Lv ${level} · retry from menu`);
      $("sort-msg").style.color = "var(--red)";
    }

    /* ---------------- input ---------------- */
    const CODE = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "rot", KeyW: "rot", KeyJ: "rot", ArrowDown: "soft", KeyS: "soft", Space: "hard" };
    const downSet = new Set();
    function startMove(dir) {
      if (state !== "control") return;
      moveDir = dir;
      move(dir);
      dasTimer = 0.16;
    }
    function stopMove(dir) {
      if (moveDir === dir) moveDir = 0;
    }
    function onKeyDown(e) {
      const k = CODE[e.code] || CODE[e.key];
      if (!k) return;
      e.preventDefault();
      if (downSet.has(k)) return;
      downSet.add(k);
      if (over) return;
      if (k === "left") startMove(-1);
      else if (k === "right") startMove(1);
      else if (k === "rot") doRotate();
      else if (k === "soft") softDrop = true;
      else if (k === "hard") hardDrop();
    }
    function onKeyUp(e) {
      const k = CODE[e.code] || CODE[e.key];
      if (!k) return;
      downSet.delete(k);
      if (k === "left") stopMove(-1);
      else if (k === "right") stopMove(1);
      else if (k === "soft") softDrop = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const btnHandlers = [];
    document.querySelectorAll("#sort-controls [data-sk]").forEach((b) => {
      const k = b.dataset.sk;
      const press = (e) => {
        e.preventDefault();
        try {
          b.setPointerCapture(e.pointerId);
        } catch (_) {}
        if (over) return;
        if (k === "left") startMove(-1);
        else if (k === "right") startMove(1);
        else if (k === "rot") doRotate();
        else if (k === "soft") softDrop = true;
        else if (k === "drop") hardDrop();
      };
      const rel = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (k === "left") stopMove(-1);
        else if (k === "right") stopMove(1);
        else if (k === "soft") softDrop = false;
      };
      b.addEventListener("pointerdown", press);
      b.addEventListener("pointerup", rel);
      b.addEventListener("pointercancel", rel);
      b.addEventListener("lostpointercapture", rel);
      btnHandlers.push([b, press, rel]);
    });

    activeCleanup = () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      btnHandlers.forEach(([b, press, rel]) => {
        b.removeEventListener("pointerdown", press);
        b.removeEventListener("pointerup", rel);
        b.removeEventListener("pointercancel", rel);
        b.removeEventListener("lostpointercapture", rel);
      });
    };

    /* ---------------- update ---------------- */
    function updateFx(dt) {
      for (const f of flashes) f.t -= dt;
      flashes = flashes.filter((f) => f.t > 0);
      if (bannerT > 0) bannerT -= dt;
    }
    function update(dt) {
      updateFx(dt);
      if (state === "over") return;
      if (state === "resolve") {
        resolveTimer -= dt;
        if (resolveTimer <= 0) resolveStep();
        return;
      }
      // control
      if (moveDir !== 0) {
        dasTimer -= dt;
        if (dasTimer <= 0) {
          move(moveDir);
          dasTimer = 0.07;
        }
      }
      fallTimer -= dt * (softDrop ? 8 : 1);
      if (fallTimer <= 0) {
        fallTimer += curFall();
        stepDown();
      }
    }

    /* ---------------- render ---------------- */
    function drawIcon(cx, cy, T) {
      const r = 5;
      c.fillStyle = "#0a0a0a";
      c.strokeStyle = "#0a0a0a";
      c.lineWidth = 1;
      const path = (fill) => {
        c.fillStyle = fill;
        c.beginPath();
        if (T.shape === "circle") c.arc(cx, cy, r, 0, 7);
        else if (T.shape === "square") c.rect(cx - r, cy - r, r * 2, r * 2);
        else if (T.shape === "triangle") {
          c.moveTo(cx, cy - r - 1);
          c.lineTo(cx + r + 1, cy + r);
          c.lineTo(cx - r - 1, cy + r);
          c.closePath();
        } else {
          c.moveTo(cx, cy - r - 1);
          c.lineTo(cx + r + 1, cy);
          c.lineTo(cx, cy + r + 1);
          c.lineTo(cx - r - 1, cy);
          c.closePath();
        }
        c.fill();
      };
      // dark outline halo then colored icon
      c.save();
      c.translate(0, 0);
      path("#0a0a0a");
      c.restore();
      const r0 = r;
      // redraw slightly smaller in color
      const T2 = T;
      const rr = r0 - 1.2;
      c.fillStyle = T2.color;
      c.beginPath();
      if (T.shape === "circle") c.arc(cx, cy, rr, 0, 7);
      else if (T.shape === "square") c.rect(cx - rr, cy - rr, rr * 2, rr * 2);
      else if (T.shape === "triangle") {
        c.moveTo(cx, cy - rr - 1);
        c.lineTo(cx + rr + 1, cy + rr);
        c.lineTo(cx - rr - 1, cy + rr);
        c.closePath();
      } else {
        c.moveTo(cx, cy - rr - 1);
        c.lineTo(cx + rr + 1, cy);
        c.lineTo(cx, cy + rr + 1);
        c.lineTo(cx - rr - 1, cy);
        c.closePath();
      }
      c.fill();
    }
    function drawDocAt(px, py, type, alpha) {
      const pad = 3,
        s = CELL - 2 * pad,
        x = px + pad,
        y = py + pad;
      const T = DOC_TYPES[type];
      c.globalAlpha = alpha == null ? 1 : alpha;
      c.fillStyle = "#0a0a0a";
      c.fillRect(x - 1, y - 1, s + 2, s + 2);
      c.fillStyle = "#f4f6fb";
      c.fillRect(x, y, s, s);
      c.fillStyle = T.color;
      c.fillRect(x, y, s, 8);
      c.fillStyle = "#cdd5e3";
      for (let i = 0; i < 3; i++) c.fillRect(x + 4, y + 13 + i * 6, s - 8, 2);
      drawIcon(x + s / 2, y + s - 10, T);
      c.globalAlpha = 1;
    }
    function drawCell(gx, gy, type, alpha) {
      drawDocAt(offX + gx * CELL, offY + gy * CELL, type, alpha);
    }
    function ghostRow() {
      let np = { ...piece };
      while (valid(cellsOf({ ...np, row: np.row + 1 }))) np.row++;
      return np;
    }
    function render() {
      c.fillStyle = "#06121c";
      c.fillRect(0, 0, W, H);
      // board frame + subtle checker
      c.fillStyle = "#0a1420";
      c.fillRect(offX - 4, offY - 4, COLS * CELL + 8, ROWS * CELL + 8);
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          c.fillStyle = (x + y) % 2 ? "#0e1a28" : "#0c1622";
          c.fillRect(offX + x * CELL, offY + y * CELL, CELL, CELL);
        }
      c.strokeStyle = "#28405a";
      c.lineWidth = 2;
      c.strokeRect(offX - 4, offY - 4, COLS * CELL + 8, ROWS * CELL + 8);
      c.lineWidth = 1;
      // locked docs
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] !== null) drawCell(x, y, grid[y][x], 1);
      // ghost + falling piece
      if (piece && state === "control") {
        const g = ghostRow();
        for (const cell of cellsOf(g)) if (cell.r >= 0) drawCell(cell.c, cell.r, cell.t, 0.22);
        for (const cell of cellsOf(piece)) if (cell.r >= 0) drawCell(cell.c, cell.r, cell.t, 1);
      }
      // pop flashes
      for (const f of flashes) {
        const k = f.t / 0.32;
        c.globalAlpha = k;
        c.fillStyle = "#ffffff";
        const px = offX + f.x * CELL,
          py = offY + f.y * CELL,
          gr = (1 - k) * 8;
        c.fillRect(px - gr, py - gr, CELL + gr * 2, CELL + gr * 2);
        c.globalAlpha = 1;
      }
      // NEXT preview (right margin)
      const nx = offX + COLS * CELL + 14,
        ny = offY + 8;
      R.pixelText(c, "NEXT", nx, ny - 2, 8, "#8fa3bf", "left");
      drawDocAt(nx, ny + 12, next.b, 1);
      drawDocAt(nx, ny + 12 + CELL, next.a, 1);
      // chain banner
      if (bannerT > 0 && banner) {
        c.globalAlpha = R.clamp(bannerT, 0, 1);
        c.fillStyle = "rgba(0,0,0,0.7)";
        c.fillRect(0, H / 2 - 16, W, 32);
        R.pixelText(c, banner, W / 2, H / 2 - 6, 12, "#ffd54a", "center");
        c.globalAlpha = 1;
      }
      if (state === "over") {
        c.fillStyle = "rgba(0,0,0,0.78)";
        c.fillRect(0, H / 2 - 36, W, 72);
        R.pixelText(c, "GAME OVER", W / 2, H / 2 - 24, 16, "#ff5d6c", "center");
        R.pixelText(c, L("점수 ", "SCORE ") + score, W / 2, H / 2 + 2, 10, "#ffd54a", "center");
      }
      $("sort-info").textContent = L("점수 ", "Score ") + score;
      $("sort-timer").textContent = "Lv " + level;
    }

    // init
    grid = newGrid();
    score = 0;
    level = 1;
    totalCleared = 0;
    chain = 0;
    over = false;
    state = "control";
    softDrop = false;
    moveDir = 0;
    dasTimer = 0;
    resolveTimer = 0;
    flashes = [];
    banner = "";
    bannerT = 0;
    fallTimer = curFall();
    next = genPiece();
    spawnPiece();
    $("sort-msg").textContent = L("같은 서류 3개 이상을 붙이면 터진다! ◀▶ 이동 · ↻ 회전 · ▼ 급강하", "Link 3+ same docs to POP them! ◀▶ move · ↻ rotate · ▼ hard-drop");
    $("sort-msg").style.color = "var(--green)";
    activeLoop = R.loop(update, render);
  }

  /* ======================= 2. 틀린 그림 찾기 (image-pair spot-the-difference) =======================
     Each stage shows a real office illustration and an AI-generated VARIANT of it
     (a few objects recoloured / added / removed). The differences are auto-detected
     by diffing base-vs-variant offline (tools/gen_hotspots.js -> img/hotspots.json),
     so every marked spot is a genuine change in the artwork. */
  let DIFF_PAIRS = []; // [{base, variant, scene, spots:[{x,y,r}], baseImg, varImg}]
  let DIFF_READY = false;
  function useDiffData(data) {
    const pairs = Object.keys(data)
      .map((k) => data[k])
      .filter((p) => p.spots && p.spots.length >= 3);
    pairs.forEach((p) => {
      p.baseImg = new Image();
      p.baseImg.src = "img/" + p.base;
      p.varImg = new Image();
      p.varImg.src = "img/" + p.variant;
    });
    DIFF_PAIRS = pairs;
    DIFF_READY = true;
  }
  (function loadDiffPairs() {
    // Preferred: data injected as a global via <script src="img/hotspots.js">.
    // This works over file:// and http:// alike. Fall back to fetch() otherwise.
    if (window.DIFF_HOTSPOTS) {
      useDiffData(window.DIFF_HOTSPOTS);
      return;
    }
    fetch("img/hotspots.json")
      .then((r) => r.json())
      .then(useDiffData)
      .catch(() => {
        DIFF_READY = true;
      });
  })();

  // ---- outlined pixel-prop drawers (centered on cx,cy) ----
  function ob(c, x, y, w, h, fill) {
    c.fillStyle = "#0a0a0a";
    c.fillRect(x - 1, y - 1, w + 2, h + 2);
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }
  function ocirc(c, x, y, r, fill) {
    c.fillStyle = "#0a0a0a";
    c.beginPath();
    c.arc(x, y, r + 1.4, 0, 7);
    c.fill();
    c.fillStyle = fill;
    c.beginPath();
    c.arc(x, y, r, 0, 7);
    c.fill();
  }
  const PROPS = {
    mug(c, x, y) {
      ob(c, x - 9, y - 8, 16, 16, "#e0473a");
      ob(c, x + 7, y - 4, 5, 9, "#e0473a");
      c.fillStyle = "#0a0a0a";
      c.fillRect(x + 9, y - 2, 2, 5);
      ob(c, x - 7, y - 8, 12, 3, "#4a2a17");
    },
    note(c, x, y) {
      ob(c, x - 9, y - 9, 18, 18, "#ffe14d");
      c.fillStyle = "#c9ab2a";
      c.fillRect(x + 3, y + 3, 6, 6);
      c.fillStyle = "#0a0a0a";
      c.fillRect(x - 5, y - 4, 10, 2);
      c.fillRect(x - 5, y, 8, 2);
    },
    plant(c, x, y) {
      ob(c, x - 8, y + 2, 16, 9, "#b5651d");
      ob(c, x - 7, y - 8, 6, 12, "#2f9e52");
      ob(c, x - 1, y - 11, 6, 15, "#3fbf66");
      ob(c, x + 4, y - 7, 6, 11, "#2f9e52");
    },
    clock(c, x, y) {
      ocirc(c, x, y, 11, "#eef2fb");
      c.strokeStyle = "#0a0a0a";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y - 8);
      c.moveTo(x, y);
      c.lineTo(x + 6, y + 2);
      c.stroke();
      c.lineWidth = 1;
    },
    lamp(c, x, y) {
      ob(c, x - 7, y + 7, 14, 4, "#3a3a3a");
      ob(c, x - 1, y - 5, 2, 12, "#555");
      c.fillStyle = "#0a0a0a";
      c.beginPath();
      c.moveTo(x - 10, y - 5);
      c.lineTo(x + 10, y - 5);
      c.lineTo(x + 6, y - 13);
      c.lineTo(x - 6, y - 13);
      c.closePath();
      c.fill();
      c.fillStyle = "#ffd54a";
      c.beginPath();
      c.moveTo(x - 8, y - 6);
      c.lineTo(x + 8, y - 6);
      c.lineTo(x + 5, y - 12);
      c.lineTo(x - 5, y - 12);
      c.closePath();
      c.fill();
    },
    stapler(c, x, y) {
      ob(c, x - 12, y - 1, 24, 7, "#2a2a2a");
      ob(c, x - 12, y - 6, 22, 5, "#e0473a");
    },
    donut(c, x, y) {
      ocirc(c, x, y, 11, "#ff8fc4");
      ocirc(c, x, y, 4, "#6b4a2b");
      c.fillStyle = "#fff";
      c.fillRect(x - 6, y - 5, 2, 2);
      c.fillRect(x + 3, y - 2, 2, 2);
      c.fillStyle = "#43d9e6";
      c.fillRect(x - 1, y + 4, 2, 2);
      c.fillStyle = "#ffe14d";
      c.fillRect(x + 4, y + 3, 2, 2);
    },
    cat(c, x, y) {
      c.fillStyle = "#0a0a0a";
      c.beginPath();
      c.moveTo(x - 9, y - 4);
      c.lineTo(x - 5, y - 13);
      c.lineTo(x - 1, y - 5);
      c.moveTo(x + 9, y - 4);
      c.lineTo(x + 5, y - 13);
      c.lineTo(x + 1, y - 5);
      c.fill();
      ocirc(c, x, y, 10, "#f2a24a");
      c.fillStyle = "#0a0a0a";
      c.fillRect(x - 5, y - 2, 2, 3);
      c.fillRect(x + 3, y - 2, 2, 3);
      c.fillStyle = "#e0473a";
      c.fillRect(x - 1, y + 2, 2, 2);
    },
    star(c, x, y) {
      c.fillStyle = "#0a0a0a";
      starPath(c, x, y, 13, 5.5);
      c.fill();
      c.fillStyle = "#ffd54a";
      starPath(c, x, y, 11, 4.5);
      c.fill();
    },
    phone(c, x, y) {
      ob(c, x - 11, y - 2, 22, 6, "#20242c");
      ob(c, x - 11, y - 6, 6, 6, "#20242c");
      ob(c, x + 5, y - 6, 6, 6, "#20242c");
    },
    bug(c, x, y) {
      ocirc(c, x, y + 1, 9, "#c73a2e");
      ocirc(c, x, y - 8, 4, "#20242c");
      c.strokeStyle = "#0a0a0a";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y - 6);
      c.lineTo(x, y + 9);
      c.moveTo(x - 9, y - 2);
      c.lineTo(x - 13, y - 5);
      c.moveTo(x + 9, y - 2);
      c.lineTo(x + 13, y - 5);
      c.stroke();
    },
    bulb(c, x, y) {
      ocirc(c, x, y - 2, 9, "#ffe14d");
      ob(c, x - 4, y + 6, 8, 5, "#9a9a9a");
    },
    balloon(c, x, y) {
      ocirc(c, x, y - 3, 9, "#e0473a");
      c.strokeStyle = "#0a0a0a";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y + 6);
      c.lineTo(x + 2, y + 13);
      c.stroke();
    },
    cup(c, x, y) {
      c.fillStyle = "#0a0a0a";
      c.beginPath();
      c.moveTo(x - 8, y - 7);
      c.lineTo(x + 8, y - 7);
      c.lineTo(x + 6, y + 9);
      c.lineTo(x - 6, y + 9);
      c.closePath();
      c.fill();
      c.fillStyle = "#f4f6fb";
      c.beginPath();
      c.moveTo(x - 6, y - 5);
      c.lineTo(x + 6, y - 5);
      c.lineTo(x + 4, y + 7);
      c.lineTo(x - 4, y + 7);
      c.closePath();
      c.fill();
      ob(c, x - 7, y - 9, 14, 3, "#e0473a");
    },
  };
  const PROP_KEYS = Object.keys(PROPS);
  function starPath(c, cx, cy, R1, R2) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? R2 : R1;
      const px = cx + Math.cos(ang) * rr,
        py = cy + Math.sin(ang) * rr;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  }

  function startDiff() {
    const cv = $("diff-canvas");
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    const W = cv.width,
      H = cv.height;
    const PANEL_H = (H - 20) / 2;
    const GAP = PANEL_H + 20; // bottom panel offset

    let stage = 1;
    let score = 0;
    let time = 0;
    let remaining = 0;
    let diffs = [];
    let over = false;
    let flashT = 0; // brief "stage clear" banner timer
    let flashMsg = "";

    function shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    let prepared = false;
    let topCv = null,
      botCv = null,
      modIsBottom = false;
    let pair = null;
    let hints = 3;
    let order = [];
    let started = false;
    let totalStages = 1;

    function initOrder() {
      order = shuffle([...Array(DIFF_PAIRS.length).keys()]);
      totalStages = order.length;
    }
    function makeCanvas() {
      const cn = document.createElement("canvas");
      cn.width = W;
      cn.height = PANEL_H;
      return cn;
    }
    // draw an image stretched to fill one panel (both panels stretch identically,
    // so the normalized hotspots line up regardless of the source aspect ratio)
    function drawTo(img) {
      const cn = makeCanvas();
      const x = cn.getContext("2d");
      x.imageSmoothingEnabled = false;
      x.drawImage(img, 0, 0, W, PANEL_H);
      return cn;
    }
    function prerender() {
      if (!pair) return false;
      const b = pair.baseImg,
        v = pair.varImg;
      if (!(b && b.complete && b.naturalWidth && v && v.complete && v.naturalWidth)) return false;
      const baseCv = drawTo(b),
        varCv = drawTo(v);
      if (modIsBottom) {
        topCv = baseCv;
        botCv = varCv;
      } else {
        topCv = varCv;
        botCv = baseCv;
      }
      prepared = true;
      return true;
    }
    function updateHintBtn() {
      const btn = $("diff-hint");
      if (btn) btn.textContent = L(`힌트 (${hints})`, `Hint (${hints})`);
    }
    function loadStage(n) {
      stage = n;
      pair = DIFF_PAIRS[order[(n - 1) % order.length]];
      diffs = pair.spots.map((s) => ({
        x: s.x * W,
        y: s.y * PANEL_H,
        r: Math.max(22, s.r * W),
        found: false,
      }));
      remaining = diffs.length;
      time = 22 + remaining * 8;
      over = false;
      prepared = false;
      modIsBottom = Math.random() < 0.5;
      $("diff-msg").textContent = L(`STAGE ${n}/${totalStages} — 다른 곳 ${remaining}군데를 찾아라!`, `STAGE ${n}/${totalStages} — find ${remaining} differences!`);
      $("diff-msg").style.color = "var(--green)";
      updateHintBtn();
    }
    function useHint() {
      if (!started || over || flashT > 0 || hints <= 0) return;
      const un = diffs.filter((d) => !d.found);
      if (!un.length) return;
      hints--;
      const d = un[(Math.random() * un.length) | 0];
      d.found = true;
      remaining--;
      score += 30;
      R.sfx.coin();
      updateHintBtn();
      if (remaining === 0) stageClear();
      else {
        $("diff-msg").textContent = L(`힌트! 남은 차이 ${remaining}곳`, `Hint! ${remaining} left`);
        $("diff-msg").style.color = "var(--amber)";
      }
    }

    function markFound(oy) {
      for (const d of diffs) {
        if (!d.found) continue;
        c.strokeStyle = "#46e07a";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(d.x, oy + d.y, d.r + 3, 0, Math.PI * 2);
        c.stroke();
        c.lineWidth = 1;
      }
    }
    function render() {
      c.fillStyle = "#05060a";
      c.fillRect(0, 0, W, H);
      if (!prepared && !prerender()) {
        R.px(c, 0, 0, W, PANEL_H, "#141824");
        R.px(c, 0, GAP, W, PANEL_H, "#141824");
        R.pixelText(c, L("불러오는 중…", "loading…"), W / 2, H / 2 - 4, 8, "#8a93a6", "center");
        $("diff-timer").textContent = Math.ceil(time) + "s";
        return;
      }
      c.drawImage(topCv, 0, 0);
      c.drawImage(botCv, 0, GAP);
      markFound(0);
      markFound(GAP);
      R.px(c, 0, PANEL_H + 6, W, 8, "#000");
      if (flashT > 0) {
        c.fillStyle = "rgba(0,0,0,0.72)";
        c.fillRect(0, H / 2 - 20, W, 40);
        R.pixelText(c, flashMsg, W / 2, H / 2 - 6, 12, "#ffd54a", "center");
      }
      $("diff-info").textContent = L(`STAGE ${stage}/${totalStages} · 남은 ${remaining}`, `STAGE ${stage}/${totalStages} · left ${remaining}`);
      $("diff-timer").textContent = Math.ceil(time) + "s";
    }

    function pointerPos(e) {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    function onDown(e) {
      if (over || flashT > 0) return;
      e.preventDefault();
      const p = pointerPos(e);
      let localY = null;
      if (p.y < PANEL_H) localY = p.y;
      else if (p.y > GAP) localY = p.y - GAP;
      if (localY === null) return;
      let hit = false;
      for (const d of diffs) {
        if (d.found) continue;
        if (Math.hypot(p.x - d.x, localY - d.y) < d.r) {
          d.found = true;
          remaining--;
          hit = true;
          score += 100;
          R.sfx.coin();
          if (remaining === 0) stageClear();
          else {
            $("diff-msg").textContent = L(`좋아! 남은 차이 ${remaining}곳`, `Nice! ${remaining} left`);
            $("diff-msg").style.color = "var(--green)";
          }
          break;
        }
      }
      if (!hit) {
        R.sfx.wrong();
        time = Math.max(0, time - 3);
        $("diff-msg").textContent = L("땡! (-3초)", "Wrong! (-3s)");
        $("diff-msg").style.color = "var(--red)";
      }
    }
    cv.addEventListener("pointerdown", onDown);

    function stageClear() {
      const bonus = Math.ceil(time) * 5;
      score += bonus;
      R.sfx.win();
      if (stage >= totalStages) {
        over = true;
        flashMsg = L("ALL CLEAR!", "ALL CLEAR!");
        flashT = 2.5;
        $("diff-msg").textContent = L(`전 스테이지 클리어! 최종 점수 ${score}점 · 관찰의 신!`, `All stages cleared! Final score ${score} · eagle eyes!`);
        $("diff-msg").style.color = "var(--amber)";
        return;
      }
      flashMsg = L(`STAGE ${stage} CLEAR! +${bonus}`, `STAGE ${stage} CLEAR! +${bonus}`);
      flashT = 1.3;
      $("diff-msg").textContent = L(`스테이지 클리어! 점수 ${score}`, `Stage clear! score ${score}`);
      $("diff-msg").style.color = "var(--amber)";
    }
    function lose() {
      over = true;
      flashMsg = L("TIME UP", "TIME UP");
      flashT = 2.2;
      R.sfx.lose();
      $("diff-msg").textContent = L(`시간 초과! STAGE ${stage}에서 종료 · 점수 ${score}. 메뉴에서 재도전`, `Time up at STAGE ${stage} · score ${score}. Retry from menu`);
      $("diff-msg").style.color = "var(--red)";
    }

    function update(dt) {
      if (!started) {
        if (DIFF_READY) {
          if (DIFF_PAIRS.length) {
            initOrder();
            loadStage(1);
            started = true;
          } else {
            $("diff-msg").textContent = L("이미지를 불러오지 못했어요", "couldn't load images");
            $("diff-msg").style.color = "var(--red)";
          }
        }
        return;
      }
      if (flashT > 0) {
        flashT -= dt;
        if (flashT <= 0 && !over) loadStage(stage + 1);
        return;
      }
      if (over) return;
      time -= dt;
      if (time <= 0) {
        time = 0;
        lose();
      }
    }

    const hintBtn = $("diff-hint");
    if (hintBtn) hintBtn.addEventListener("click", useHint);
    activeCleanup = () => {
      cv.removeEventListener("pointerdown", onDown);
      if (hintBtn) hintBtn.removeEventListener("click", useHint);
    };

    activeLoop = R.loop(update, render);
  }

  /* ==================== 3. 넌센스 퀴즈 (2020s 빅테크/BPO, 100+) ====================
     Pool of 100+ relatable modern-office nonsense questions. Each play draws a
     random SESSION-length subset and shuffles the choices. index a = the (funny,
     painfully true) correct choice within the source `choices` array. */
  const QUIZ_KO = [
    { q: "스탠드업 미팅의 '15분'과 실제 소요 시간의 관계는?", choices: ["둘 다 15분", "15분이라 쓰고 45분", "실제가 더 짧다", "정시 종료"], a: 1 },
    { q: "'이건 오프라인으로 얘기하죠'의 진짜 의미는?", choices: ["회사 밖에서 만나자", "이 논쟁 지금 여기서 그만", "전화로 하자", "녹화 끄자"], a: 1 },
    { q: "슬랙 상태가 '자리비움'인데 5초 만에 답장 온 이유는?", choices: ["운이 좋았다", "사실 계속 보고 있었다", "봇이 대답", "우연"], a: 1 },
    { q: "'빠르게 콜 한 번만'의 평균 실제 소요 시간은?", choices: ["5분", "40분 이상", "10분", "1분"], a: 1 },
    { q: "Zoom에서 '음소거이신 것 같아요'를 듣는 정확한 타이밍은?", choices: ["말하기 직전", "열정적으로 3분 말한 직후", "회의 끝", "입장 직후"], a: 1 },
    { q: "'애자일하게 하자'의 현실 번역은?", choices: ["체계적 반복 개발", "계획 없이 그때그때", "문서 철저", "스프린트 준수"], a: 1 },
    { q: "금요일 오후 4시 프로덕션 배포의 통계적 결말은?", choices: ["무사 종료", "주말 반납 장애 대응", "성공적 릴리스", "롤백 없음"], a: 1 },
    { q: "PR에 'LGTM'을 단 리뷰어가 실제로 본 것은?", choices: ["전체 로직", "제목과 diff 첫 줄", "테스트 케이스", "엣지 케이스"], a: 1 },
    { q: "'다음 분기 로드맵에 넣을게요'의 실제 뜻은?", choices: ["곧 착수", "사실상 영원히 안 함", "확정됨", "이미 개발 중"], a: 1 },
    { q: "재택 중 카메라를 끄는 가장 흔한 진짜 이유는?", choices: ["대역폭 절약", "아직 잠옷 차림", "집중하려고", "배경 정리 안 됨"], a: 1 },
    { q: "'이거 MVP예요'라고 소개된 결과물의 운명은?", choices: ["곧 고도화", "그대로 최종본이 됨", "폐기", "프로토타입에서 끝"], a: 1 },
    { q: "백로그 그루밍 회의 후 백로그의 상태는?", choices: ["깔끔히 정리됨", "티켓이 더 늘어남", "절반 삭제", "우선순위 확정"], a: 1 },
    { q: "회사 VPN이 끊기는, 우주 법칙상 최적의 타이밍은?", choices: ["한가할 때", "고객 데모 5초 전", "점심시간", "퇴근 직후"], a: 1 },
    { q: "'동기화(sync) 한번 하시죠'가 실제로 여는 것은?", choices: ["구글 캘린더", "또 다른 회의", "코드 머지", "데이터 백업"], a: 1 },
    { q: "OKR 리뷰에서 달성률 70%의 자체 평가는?", choices: ["명백한 실패", "'적절히 도전적이었다'", "초과 달성", "측정 불가"], a: 1 },
    { q: "노션에 정성껏 쓴 문서를 다시 여는 시점은?", choices: ["매일 아침", "작성 직후 영영 안 봄", "주간 회의", "분기 리뷰"], a: 1 },
    { q: "'퀵 싱크'라는 회의의 참석자 수 변화는?", choices: ["2명 유지", "어느새 8명", "점점 감소", "0명"], a: 1 },
    { q: "스탠드업에서 말하는 '어제 한 일'의 실제 내용은?", choices: ["구체적 산출물", "회의에 참석했다는 말", "커밋 수", "버그 수정"], a: 1 },
    { q: "'이번 스프린트에 넣을 수 있죠?'에 대한 현실적 첫 반응은?", choices: ["네 여유됩니다", "(마른 웃음)", "물론이죠", "이미 했어요"], a: 1 },
    { q: "코드 리뷰가 가장 빨리 승인되는 변경은?", choices: ["핵심 기능", "오타 한 글자 수정", "대형 리팩터", "보안 패치"], a: 1 },
    { q: "'바쁘신 거 아는데 잠깐이면 돼요'의 잠깐은?", choices: ["진짜 잠깐", "30분 이상", "5분", "즉시 끝"], a: 1 },
    { q: "상무님의 'AI로 이거 안 되나?'에 대한 최선의 답은?", choices: ["불가능합니다", "가능성 검토해보겠습니다", "이미 됩니다", "AI가 뭔가요"], a: 1 },
    { q: "ChatGPT에 시킨 업무를 검수하는 데 드는 시간은?", choices: ["0분", "직접 하는 것과 비슷", "1분", "자동"], a: 1 },
    { q: "'사소한 변경이에요'라고 한 배포가 부르는 것은?", choices: ["무해", "프로덕션 장애", "칭찬", "보너스"], a: 1 },
    { q: "온콜 당번의 알람이 울리는 시간대의 법칙은?", choices: ["업무 시간", "새벽 3시", "점심", "금요일 오전"], a: 1 },
    { q: "'블레임리스 회고'의 실제 분위기는?", choices: ["정말 비난 없음", "눈빛으로 범인 특정", "화기애애", "생산적"], a: 1 },
    { q: "스토리 포인트 산정의 과학적 근거는?", choices: ["정밀 계산", "손가락 감", "과거 데이터", "AI 예측"], a: 1 },
    { q: "번다운 차트가 스프린트 마지막 날 보여주는 것은?", choices: ["완만한 하강", "마지막 날 절벽 하강", "이미 0", "꾸준함"], a: 1 },
    { q: "'그건 제 담당이 아니에요'의 회사식 완곡 표현은?", choices: ["담당 아님", "'적임자에게 연결해드릴게요'", "싫어요", "몰라요"], a: 1 },
    { q: "회의록 '액션 아이템'이 다음 회의까지 진행된 정도는?", choices: ["완료", "다음 회의에서 재확인", "진행 중", "착수함"], a: 1 },
    { q: "콜센터 AHT(평균 처리시간)를 늘리는 최고의 방법은?", choices: ["빠른 응대", "'상급자 확인 후 다시 연락'", "스크립트 준수", "즉답"], a: 1 },
    { q: "BPO 야간조가 밤낮을 바꾸는 진짜 이유는?", choices: ["건강", "해외 클라이언트 시간대", "조용해서", "야간수당"], a: 1 },
    { q: "'통화는 품질 향상을 위해 녹음됩니다'의 숨은 뜻은?", choices: ["단순 안내", "QA가 점수 매김", "보안", "광고"], a: 1 },
    { q: "고객이 '매니저 바꿔'라고 할 때 상담사의 속마음은?", choices: ["환영", "심호흡", "기쁨", "무념무상"], a: 1 },
    { q: "CSAT 설문의 '보통(3점)'이 상담사에게 주는 의미는?", choices: ["칭찬", "사실상 감점", "무의미", "보너스"], a: 1 },
    { q: "L2로 에스컬레이션한 티켓이 돌아오는 흔한 이유는?", choices: ["해결됨", "'정보 부족'으로 반송", "자동 종료", "고객 만족"], a: 1 },
    { q: "상담 스크립트를 벗어나면 안 되는 진짜 이유는?", choices: ["효율", "QA 스코어카드", "친절", "속도"], a: 1 },
    { q: "'잠시만 대기해 주시겠어요'의 실제 대기 시간은?", choices: ["30초", "노래 두 곡 분량", "즉시", "1분"], a: 1 },
    { q: "어드히어런스(근태 준수율)를 은근히 깎는 주범은?", choices: ["회의", "화장실 자리비움", "점심", "교육"], a: 1 },
    { q: "샤워보다 짧아야 한다고 압박받는 콜센터 지표는?", choices: ["통화 시간", "랩업(후처리) 시간", "휴식", "점심"], a: 1 },
    { q: "지식베이스(KB)를 검색해도 답이 없을 때의 진실은?", choices: ["문서 완비", "문서가 최신이 아님", "고객 잘못", "시스템 오류"], a: 1 },
    { q: "'첫 통화 해결(FCR)'을 방해하는 최대 요인은?", choices: ["상담사 실력", "'다시 전화 주세요' 시스템", "고객", "날씨"], a: 1 },
    { q: "옥커펀시(가동률) 100%가 상담사에게 의미하는 것은?", choices: ["효율 최고", "숨 쉴 틈 없음", "보너스", "칭찬"], a: 1 },
    { q: "클라이언트 SLA가 임박했을 때 대기열(큐)의 상태는?", choices: ["텅 빔", "갑자기 폭증", "안정", "0건"], a: 1 },
    { q: "RSU 1년 클리프(베스팅 절벽)의 교훈은?", choices: ["즉시 부자", "1년은 버텨야 한다", "의미 없음", "매일 매도"], a: 1 },
    { q: "스타트업 '런웨이'가 짧아질 때의 첫 신호는?", choices: ["채용 확대", "무료 간식이 사라짐", "연봉 인상", "사무실 확장"], a: 1 },
    { q: "'하이퍼그로스'의 대표적 부작용은?", choices: ["안정", "프로세스 붕괴", "여유", "휴가 증가"], a: 1 },
    { q: "'노스 스타 메트릭'을 정하는 회의의 결말은?", choices: ["하나로 합의", "지표가 5개로 늘어남", "즉시 확정", "측정 시작"], a: 1 },
    { q: "'우린 가족 같은 회사'라는 문구의 해석은?", choices: ["따뜻함", "야근과 낮은 연봉의 예고", "복지 좋음", "수평적"], a: 1 },
    { q: "레이오프 발표 이메일 제목으로 흔한 것은?", choices: ["'해고 통보'", "'조직 개편과 앞으로의 여정'", "'축하합니다'", "'휴가 안내'"], a: 1 },
    { q: "무제한 휴가(PTO) 정책의 실제 사용률은?", choices: ["무제한", "일반 휴가보다 오히려 적게 씀", "전부 소진", "반반"], a: 1 },
    { q: "'우리는 데이터 기반으로 결정합니다'의 예외는?", choices: ["예외 없음", "임원이 이미 정한 경우", "항상", "가끔"], a: 1 },
    { q: "'그건 제 대역폭(bandwidth) 밖이에요'의 뜻은?", choices: ["인터넷이 느림", "나 지금 그거 할 여력 없음", "용량 초과", "와이파이 문제"], a: 1 },
    { q: "'서클백 하겠습니다(circle back)'의 실제 후속은?", choices: ["곧 회신", "영원한 침묵", "즉시 처리", "회의 소집"], a: 1 },
    { q: "'시너지'라는 단어가 등장하는 순간은?", choices: ["실제 협업 중", "딱히 할 말 없을 때", "성과 발표", "기술 회의"], a: 1 },
    { q: "'로우행잉 프루트부터 하자'의 뜻은?", choices: ["과일 주문", "쉬운 것부터 하자", "어려운 것 먼저", "전부 하자"], a: 1 },
    { q: "'바늘을 움직이자(move the needle)'가 요구하는 것은?", choices: ["재봉", "실질 성과를 내라", "바느질", "측정만"], a: 1 },
    { q: "'이건 EOD까지'에서 EOD의 체감 시각은?", choices: ["오후 6시", "자정 직전", "오후 3시", "내일"], a: 1 },
    { q: "'FYI'만 달랑 붙은 전달 메일의 속뜻은?", choices: ["참고만 하세요", "'이제 네 문제야'", "칭찬", "무시해도 됨"], a: 1 },
    { q: "'퀵 윈(quick win)을 찾자'는 회의의 소요 시간은?", choices: ["빠름", "한 시간 이상", "10분", "즉시"], a: 1 },
    { q: "'지난 메일에서 말씀드렸듯이'의 실제 톤은?", choices: ["친절", "'읽으라고 했잖아요'", "중립", "사과"], a: 1 },
    { q: "OOO(부재중) 자동응답을 켜고도 답장하는 사람은?", choices: ["성실함", "쉬지 못하는 우리", "봇", "관리자"], a: 1 },
    { q: "'전체 답장(Reply All)' 재앙이 시작되는 순간은?", choices: ["없음", "누가 '저 좀 빼주세요'를 전체답장", "즉시 종료", "조용함"], a: 1 },
    { q: "'짧게 정리하면(TL;DR)' 뒤 문장의 실제 길이는?", choices: ["한 줄", "여전히 세 문단", "제목만", "없음"], a: 1 },
    { q: "회신 없는 메일에 다시 보내는 '위로 올립니다'의 뜻은?", choices: ["엘리베이터", "'제발 답 좀 해주세요'", "인사", "실수"], a: 1 },
    { q: "캘린더가 회의로 꽉 찬 날의 실제 업무 시간은?", choices: ["8시간", "회의 사이 5분씩", "6시간", "점심 후"], a: 1 },
    { q: "'주 3일 출근(RTO)' 정책의 진짜 목적은?", choices: ["협업 강화", "비싼 사무실 임대료 정당화", "건강", "친목"], a: 1 },
    { q: "핫데스크(자율좌석)에서 매일 아침 벌어지는 일은?", choices: ["평화", "좋은 자리 쟁탈전", "지정 착석", "추첨"], a: 1 },
    { q: "재택 중 '마우스 움직임 유지' 앱의 진짜 용도는?", choices: ["운동", "슬랙 초록불 유지", "건강 관리", "알림 설정"], a: 1 },
    { q: "큰맘 먹고 출근했더니 팀 전원이 재택인 날의 감정은?", choices: ["기쁨", "허탈함", "분노", "무념무상"], a: 1 },
    { q: "'AI가 일자리를 없앤다'에 대한 현실적 대응은?", choices: ["공포에 떤다", "일단 회의록 요약부터 시킨다", "무시", "이직"], a: 1 },
    { q: "코파일럿이 짜준 코드의 첫 상태는?", choices: ["완벽", "그럴듯한데 미묘하게 틀림", "실행 불가", "최적화 완료"], a: 1 },
    { q: "'프롬프트 엔지니어'가 하루에 가장 많이 하는 말은?", choices: ["명확한 명령", "'다시, 이번엔 제대로'", "칭찬", "질문"], a: 1 },
    { q: "AI 요약만 믿고 회의에 안 들어간 결과는?", choices: ["무사", "중요한 걸 놓침", "이득", "승진"], a: 1 },
    { q: "'금방 끝나요'라고 한 마이그레이션의 실제 기간은?", choices: ["하루", "분기 하나", "일주일", "반나절"], a: 1 },
    { q: "'테스트는 나중에 추가하죠'의 '나중'은 언제?", choices: ["다음 주", "장애가 터진 뒤", "내일", "곧"], a: 1 },
    { q: "'문서화는 마지막에'라고 한 프로젝트의 결말은?", choices: ["문서 완성", "그 마지막이 오지 않음", "훌륭한 위키", "자동 생성"], a: 1 },
    { q: "핫픽스가 결국 불러오는 것은?", choices: ["안정", "또 다른 핫픽스", "칭찬", "종료"], a: 1 },
    { q: "스탠드업이 45분으로 늘어나는 결정적 이유는?", choices: ["짧아서", "'하나만 더 얘기하면'", "엄격한 진행", "효율"], a: 1 },
    { q: "'이 기능 누가 만들었어요?'라는 질문의 분위기는?", choices: ["칭찬 예고", "범인 색출", "순수 호기심", "감사"], a: 1 },
    { q: "레거시 코드에 주석이 없는 이유는?", choices: ["코드가 명확해서", "떠난 사람만 알아서", "불필요해서", "자동 생성이라"], a: 1 },
    { q: "'원래 그렇게 동작해요(의도된 사양)'의 진짜 뜻은?", choices: ["정말 의도됨", "고치기 귀찮음", "완벽함", "테스트 완료"], a: 1 },
    { q: "데모의 법칙 — 리허설과 실전의 차이는?", choices: ["동일", "실전에서만 터진다", "실전이 낫다", "무관"], a: 1 },
    { q: "'거의 다 됐어요(90%)'가 지속되는 기간은?", choices: ["하루", "남은 90%만큼 더", "완료 임박", "즉시"], a: 1 },
    { q: "회사 프린터가 상징하는 것은?", choices: ["편의", "이유 없는 분노", "효율", "첨단 기술"], a: 1 },
    { q: "'우선순위가 다 1순위예요'가 실제로 의미하는 것은?", choices: ["명확함", "우선순위가 없음", "효율", "전략"], a: 1 },
    { q: "신입에게 '편하게 물어봐' 후 실제로 돌아오는 것은?", choices: ["따뜻한 환영", "'그것도 몰라?'의 눈빛", "친절한 설명", "체계적 교육"], a: 1 },
    { q: "'열정 페이'의 정확한 환산 가치는?", choices: ["높음", "0원", "보통", "협상 가능"], a: 1 },
    { q: "'주인의식을 가지세요'의 숨은 요구는?", choices: ["권한 부여", "월급 외 책임 부담", "승진", "지분"], a: 1 },
    { q: "성과 리뷰에서 '기대를 충족함'의 실제 등급은?", choices: ["최고 등급", "'특별할 것 없음'", "우수", "승진감"], a: 1 },
    { q: "PIP(성과개선계획)에 올랐을 때의 통상적 결말은?", choices: ["실력 향상", "사실상 출구 안내", "승진", "보너스"], a: 1 },
    { q: "'수평적 문화'라는 회사의 실제 최종 결정권자는?", choices: ["모두 함께", "결국 대표님", "팀 투표", "합의"], a: 1 },
    { q: "'자율 출퇴근'의 실제 자율 범위는?", choices: ["완전 자율", "코어타임 빼고", "무제한", "사실상 없음"], a: 1 },
    { q: "타운홀 Q&A 시간에 실제로 벌어지는 일은?", choices: ["활발한 질문", "정적과 귀뚜라미", "날카로운 질문", "박수"], a: 1 },
    { q: "'익명' 직원 만족도 설문의 실제 익명성은?", choices: ["완전 익명", "왠지 특정될 것 같음", "완벽 보장", "안전"], a: 1 },
    { q: "회식 자리에서 '오늘은 편하게'의 실제 편안함은?", choices: ["진짜 편함", "상사 앞이라 더 불편", "자유로움", "즐거움"], a: 1 },
    { q: "'조직을 위한 결정'의 실제 최대 수혜자는?", choices: ["조직", "그 결정을 내린 사람", "직원", "고객"], a: 1 },
    { q: "'글로벌 스탠다드 도입'을 외치는 회사의 현실은?", choices: ["진짜 세계적", "직함만 영어로 바뀜", "선진 시스템", "혁신"], a: 1 },
    { q: "화상회의 배경 흐림(블러)의 진짜 이유는?", choices: ["프라이버시", "치우지 못한 방", "보안", "집중"], a: 1 },
    { q: "'우리 회사 워라밸 좋아요'가 성립하는 조건은?", choices: ["항상", "면접 볼 때만", "야근 없음", "주 4일"], a: 1 },
    { q: "'긍정적으로 검토하겠습니다'의 실제 결론은?", choices: ["승인", "완곡한 거절", "보류", "즉시 실행"], a: 1 },
    { q: "'점심 뭐 먹지?'라는 회의의 결론 도출 시간은?", choices: ["1분", "회의 중 가장 긴 시간", "즉시", "5분"], a: 1 },
    { q: "'퇴근 5분 전' 팀장 메시지의 단골 내용은?", choices: ["'수고했어'", "'잠깐 이것만'", "칭찬", "안부"], a: 1 },
    { q: "무한 스크롤되는 대시보드의 실제 열람 빈도는?", choices: ["매시간", "만든 사람만 가끔", "매일", "실시간"], a: 1 },
    { q: "'논의는 스레드로 부탁드립니다' 이후 실제 상황은?", choices: ["스레드로 정리됨", "채널에 그대로 도배", "조용함", "종료"], a: 1 },
    { q: "'다들 아시겠지만'으로 시작하는 설명의 실제 청중은?", choices: ["다 아는 사람들", "아무도 모르던 내용", "전문가", "신입"], a: 1 },
  ];
  const QUIZ_EN = [
    { q: "The 15-minute stand-up vs. how long it actually takes?", choices: ["Both 15 min", "Says 15, runs 45", "Actually shorter", "Ends on time"], a: 1 },
    { q: "What does 'let's take this offline' really mean?", choices: ["Meet outside the office", "Stop this argument right now", "Do it by phone", "Turn off recording"], a: 1 },
    { q: "Your Slack shows 'Away' but you reply in 5 seconds because?", choices: ["Lucky timing", "You were watching the whole time", "A bot replied", "Coincidence"], a: 1 },
    { q: "Average real duration of a 'quick call'?", choices: ["5 min", "40+ min", "10 min", "1 min"], a: 1 },
    { q: "Exact moment you hear 'I think you're on mute'?", choices: ["Before you speak", "Right after 3 passionate minutes", "End of the call", "On joining"], a: 1 },
    { q: "Real translation of 'let's be agile about it'?", choices: ["Structured iteration", "No plan, just wing it", "Thorough docs", "Strict sprints"], a: 1 },
    { q: "Statistical outcome of a 4 PM Friday prod deploy?", choices: ["All fine", "Weekend incident duty", "Clean release", "No rollback"], a: 1 },
    { q: "What a reviewer who left 'LGTM' actually read?", choices: ["The whole logic", "The title and first diff line", "The test cases", "Edge cases"], a: 1 },
    { q: "Real meaning of 'we'll put it on next quarter's roadmap'?", choices: ["Starting soon", "Effectively never", "It's locked in", "Already building"], a: 1 },
    { q: "Most common real reason to keep your camera off at home?", choices: ["Save bandwidth", "Still in pajamas", "To focus", "Messy background"], a: 1 },
    { q: "The fate of anything introduced as 'just an MVP'?", choices: ["Soon improved", "Becomes the final version", "Scrapped", "Ends as a prototype"], a: 1 },
    { q: "State of the backlog after a grooming meeting?", choices: ["Nicely tidied", "Even more tickets", "Half deleted", "Priorities locked"], a: 1 },
    { q: "By cosmic law, when does the company VPN drop?", choices: ["When you're idle", "5 seconds before a client demo", "At lunch", "Right after login"], a: 1 },
    { q: "What 'let's do a quick sync' actually opens?", choices: ["Google Calendar", "Yet another meeting", "A code merge", "A data backup"], a: 1 },
    { q: "Self-assessment of hitting 70% on an OKR?", choices: ["Clear failure", "'Appropriately ambitious'", "Overachieved", "Unmeasurable"], a: 1 },
    { q: "When do you reopen that Notion doc you crafted?", choices: ["Every morning", "Never again after writing it", "Weekly sync", "Quarterly review"], a: 1 },
    { q: "Attendee count trajectory of a 'quick sync'?", choices: ["Stays at 2", "Somehow becomes 8", "Shrinks", "Zero"], a: 1 },
    { q: "What 'what I did yesterday' in standup actually is?", choices: ["Concrete output", "'I attended meetings'", "Commit count", "Bug fixes"], a: 1 },
    { q: "Realistic first reaction to 'can we fit this in the sprint?'?", choices: ["Sure, plenty of room", "(a dry laugh)", "Of course", "Already did it"], a: 1 },
    { q: "Which change gets a code review approved fastest?", choices: ["A core feature", "A one-letter typo fix", "A huge refactor", "A security patch"], a: 1 },
    { q: "How long is the 'quick' in 'I know you're busy, just a quick sec'?", choices: ["Truly quick", "30+ minutes", "5 minutes", "Instant"], a: 1 },
    { q: "Best answer to an exec's 'can't AI just do this?'", choices: ["It's impossible", "We'll explore the possibility", "It already can", "What's AI?"], a: 1 },
    { q: "Time it takes to review work you handed to ChatGPT?", choices: ["0 min", "About as long as doing it yourself", "1 min", "Automatic"], a: 1 },
    { q: "What a deploy called 'a tiny change' summons?", choices: ["Nothing", "A production incident", "Praise", "A bonus"], a: 1 },
    { q: "The law of when your on-call pager fires?", choices: ["Business hours", "3 AM", "Lunch", "Friday morning"], a: 1 },
    { q: "Actual vibe of a 'blameless post-mortem'?", choices: ["Truly no blame", "Eyes pinpoint the culprit", "Warm and fuzzy", "Productive"], a: 1 },
    { q: "The scientific basis for story-point estimates?", choices: ["Precise math", "A gut feeling", "Historical data", "AI prediction"], a: 1 },
    { q: "What the burndown chart shows on the sprint's last day?", choices: ["A gentle slope", "A cliff on the final day", "Already zero", "Steady progress"], a: 1 },
    { q: "Corporate euphemism for 'that's not my job'?", choices: ["Not my job", "'Let me connect you with the right person'", "No thanks", "No idea"], a: 1 },
    { q: "How far 'action items' progress before the next meeting?", choices: ["Done", "Re-confirmed next meeting", "In progress", "Kicked off"], a: 1 },
    { q: "Best way to inflate a call center's AHT (avg handle time)?", choices: ["Answer fast", "'Let me check with my supervisor and call back'", "Follow the script", "Answer instantly"], a: 1 },
    { q: "Real reason BPO night shifts flip day and night?", choices: ["Health", "Overseas client time zones", "It's quiet", "Night pay"], a: 1 },
    { q: "Hidden meaning of 'this call may be recorded for quality'?", choices: ["Just a notice", "QA is scoring you", "Security", "An ad"], a: 1 },
    { q: "An agent's inner thought when a customer says 'get me a manager'?", choices: ["Delight", "A deep breath", "Joy", "Pure zen"], a: 1 },
    { q: "What a '3/5 (neutral)' CSAT means to an agent?", choices: ["Praise", "Basically a penalty", "Meaningless", "A bonus"], a: 1 },
    { q: "Common reason a ticket escalated to L2 comes back?", choices: ["Solved", "Bounced for 'insufficient info'", "Auto-closed", "Customer satisfied"], a: 1 },
    { q: "Real reason you can't stray from the call script?", choices: ["Efficiency", "The QA scorecard", "Politeness", "Speed"], a: 1 },
    { q: "Actual wait time behind 'could you hold for a moment'?", choices: ["30 seconds", "About two songs", "Instant", "1 minute"], a: 1 },
    { q: "The sneaky killer of your adherence score?", choices: ["Meetings", "Bathroom breaks", "Lunch", "Training"], a: 1 },
    { q: "Which call-center metric they pressure to be shorter than a shower?", choices: ["Talk time", "Wrap-up (after-call) time", "Break", "Lunch"], a: 1 },
    { q: "The truth when the knowledge base has no answer?", choices: ["Docs are complete", "The docs aren't up to date", "Customer's fault", "System error"], a: 1 },
    { q: "Biggest obstacle to First Call Resolution (FCR)?", choices: ["Agent skill", "The 'please call back' system", "The customer", "The weather"], a: 1 },
    { q: "What 100% occupancy means to an agent?", choices: ["Peak efficiency", "No time to breathe", "A bonus", "Praise"], a: 1 },
    { q: "State of the queue right as the client SLA looms?", choices: ["Empty", "Suddenly spikes", "Stable", "Zero"], a: 1 },
    { q: "The lesson of the 1-year RSU cliff?", choices: ["Instantly rich", "Survive one year", "Meaningless", "Sell daily"], a: 1 },
    { q: "First sign a startup's 'runway' is getting short?", choices: ["More hiring", "The free snacks vanish", "Raises", "Office expansion"], a: 1 },
    { q: "A classic side effect of 'hypergrowth'?", choices: ["Stability", "Process collapse", "Free time", "More vacation"], a: 1 },
    { q: "How a meeting to pick the 'north star metric' ends?", choices: ["One agreed metric", "It becomes 5 metrics", "Locked instantly", "Measurement begins"], a: 1 },
    { q: "How to read 'we're like a family here'?", choices: ["Warmth", "A warning of overtime and low pay", "Great benefits", "Flat hierarchy"], a: 1 },
    { q: "Common subject line for a layoff announcement email?", choices: ["'You're fired'", "'Org changes and the road ahead'", "'Congratulations'", "'Vacation notice'"], a: 1 },
    { q: "Real usage rate of an 'unlimited PTO' policy?", choices: ["Unlimited", "Less than normal PTO", "Fully used", "Half and half"], a: 1 },
    { q: "The exception to 'we make data-driven decisions'?", choices: ["No exceptions", "When an exec already decided", "Always", "Sometimes"], a: 1 },
    { q: "Meaning of 'that's outside my bandwidth'?", choices: ["Slow internet", "I can't take that on right now", "Over capacity", "Wi-Fi issue"], a: 1 },
    { q: "The real follow-up to 'I'll circle back'?", choices: ["Prompt reply", "Eternal silence", "Immediate action", "Calls a meeting"], a: 1 },
    { q: "When does the word 'synergy' appear?", choices: ["During real collaboration", "When there's nothing to say", "In results", "In tech reviews"], a: 1 },
    { q: "Meaning of 'let's grab the low-hanging fruit'?", choices: ["Order fruit", "Do the easy stuff first", "Hardest first", "Do everything"], a: 1 },
    { q: "What 'let's move the needle' demands?", choices: ["Sewing", "Deliver real impact", "Stitching", "Just measure"], a: 1 },
    { q: "Perceived time of 'EOD' in 'get it to me by EOD'?", choices: ["6 PM", "Just before midnight", "3 PM", "Tomorrow"], a: 1 },
    { q: "Subtext of a forwarded email with only 'FYI'?", choices: ["Just so you know", "'This is your problem now'", "Praise", "Safe to ignore"], a: 1 },
    { q: "Duration of a meeting to 'find some quick wins'?", choices: ["Quick", "Over an hour", "10 minutes", "Instant"], a: 1 },
    { q: "The real tone of 'as per my last email'?", choices: ["Friendly", "'I told you to read it'", "Neutral", "Apologetic"], a: 1 },
    { q: "Who replies to email despite their OOO auto-reply being on?", choices: ["The diligent", "Us, unable to rest", "A bot", "A manager"], a: 1 },
    { q: "When does the 'Reply All' disaster begin?", choices: ["Never", "Someone replies-all 'please remove me'", "It ends fast", "Silence"], a: 1 },
    { q: "Actual length of the text after 'TL;DR'?", choices: ["One line", "Still three paragraphs", "Title only", "Nothing"], a: 1 },
    { q: "Meaning of resending an ignored email with 'bumping this up'?", choices: ["An elevator", "'Please, just reply'", "A greeting", "A mistake"], a: 1 },
    { q: "Actual work time on a day packed with meetings?", choices: ["8 hours", "5 minutes between meetings", "6 hours", "After lunch"], a: 1 },
    { q: "The real purpose of a '3 days in office (RTO)' policy?", choices: ["Better collaboration", "Justify the expensive lease", "Health", "Bonding"], a: 1 },
    { q: "What happens every morning with hot-desking?", choices: ["Peace", "A fight for the good seats", "Assigned seating", "A lottery"], a: 1 },
    { q: "Real purpose of a 'mouse jiggler' app while WFH?", choices: ["Exercise", "Keep the Slack dot green", "Health", "Notifications"], a: 1 },
    { q: "Your emotion when you commute in and the whole team is remote?", choices: ["Joy", "Emptiness", "Rage", "Pure zen"], a: 1 },
    { q: "Realistic response to 'AI will take our jobs'?", choices: ["Panic", "First, make it summarize the meeting notes", "Ignore it", "Quit"], a: 1 },
    { q: "Initial state of code Copilot wrote for you?", choices: ["Perfect", "Plausible but subtly wrong", "Won't run", "Fully optimized"], a: 1 },
    { q: "What a 'prompt engineer' says most in a day?", choices: ["Clear commands", "'Again, this time properly'", "Praise", "Questions"], a: 1 },
    { q: "Result of skipping a meeting and trusting the AI summary?", choices: ["All fine", "You missed the key point", "A win", "A promotion"], a: 1 },
    { q: "Real duration of a migration called 'it'll be quick'?", choices: ["A day", "An entire quarter", "A week", "Half a day"], a: 1 },
    { q: "When is the 'later' in 'let's add tests later'?", choices: ["Next week", "After an outage", "Tomorrow", "Soon"], a: 1 },
    { q: "The fate of a project that said 'we'll document at the end'?", choices: ["Docs finished", "That 'end' never comes", "A great wiki", "Auto-generated"], a: 1 },
    { q: "What a hotfix ultimately brings?", choices: ["Stability", "Another hotfix", "Praise", "The end"], a: 1 },
    { q: "The decisive reason a standup stretches to 45 minutes?", choices: ["It's short", "'Just one more thing'", "Strict facilitation", "Efficiency"], a: 1 },
    { q: "The mood behind 'who built this feature?'", choices: ["Praise incoming", "Hunting the culprit", "Pure curiosity", "Gratitude"], a: 1 },
    { q: "Why legacy code has no comments?", choices: ["It's self-evident", "Only the person who left knows", "Unnecessary", "Auto-generated"], a: 1 },
    { q: "Real meaning of 'it works as intended (by design)'?", choices: ["Truly intended", "Too annoying to fix", "It's perfect", "Fully tested"], a: 1 },
    { q: "Law of demos — rehearsal vs. the real thing?", choices: ["Identical", "It only breaks live", "Live is better", "Unrelated"], a: 1 },
    { q: "How long '90%, almost done' persists?", choices: ["A day", "As long as the remaining 90%", "Nearly done", "Instant"], a: 1 },
    { q: "What the office printer symbolizes?", choices: ["Convenience", "Rage for no reason", "Efficiency", "Cutting-edge tech"], a: 1 },
    { q: "What 'everything is priority #1' really means?", choices: ["Clarity", "There is no priority", "Efficiency", "Strategy"], a: 1 },
    { q: "What you actually get after telling a newbie 'feel free to ask'?", choices: ["A warm welcome", "A 'you don't know THAT?' look", "Kind explanations", "Structured training"], a: 1 },
    { q: "The exact cash value of 'exposure/passion pay'?", choices: ["High", "$0", "Average", "Negotiable"], a: 1 },
    { q: "The hidden ask behind 'take ownership'?", choices: ["Real authority", "Extra responsibility, same pay", "A promotion", "Equity"], a: 1 },
    { q: "The real grade behind 'meets expectations' in a review?", choices: ["Top grade", "'Nothing special'", "Excellent", "Promotable"], a: 1 },
    { q: "The usual ending once you're put on a PIP?", choices: ["You improve", "Effectively the exit door", "Promotion", "Bonus"], a: 1 },
    { q: "The real final decision-maker at a 'flat culture' company?", choices: ["Everyone together", "The CEO, ultimately", "A team vote", "Consensus"], a: 1 },
    { q: "The real range of 'flexible hours'?", choices: ["Fully flexible", "Except for core hours", "Unlimited", "Basically none"], a: 1 },
    { q: "What actually happens during town-hall Q&A?", choices: ["Lively questions", "Silence and crickets", "Sharp questions", "Applause"], a: 1 },
    { q: "The real anonymity of an 'anonymous' employee survey?", choices: ["Fully anonymous", "Somehow identifiable", "Perfectly guaranteed", "Safe"], a: 1 },
    { q: "Actual comfort of 'relax, be yourself' at a team dinner?", choices: ["Truly relaxed", "More awkward with the boss there", "Freeing", "Fun"], a: 1 },
    { q: "The biggest beneficiary of a decision 'for the organization'?", choices: ["The organization", "The person who made it", "Employees", "Customers"], a: 1 },
    { q: "Reality of a company shouting 'adopting global standards'?", choices: ["Truly world-class", "Only the job titles turn English", "Advanced systems", "Innovation"], a: 1 },
    { q: "The real reason for the video-call background blur?", choices: ["Privacy", "A room you didn't tidy", "Security", "Focus"], a: 1 },
    { q: "The condition under which 'we have great work-life balance' holds?", choices: ["Always", "Only during the interview", "No overtime", "4-day week"], a: 1 },
    { q: "The real conclusion of 'we'll review it positively'?", choices: ["Approval", "A polite no", "On hold", "Immediate action"], a: 1 },
    { q: "Time to reach a conclusion in a 'where should we eat?' meeting?", choices: ["1 minute", "The longest meeting of the day", "Instant", "5 minutes"], a: 1 },
    { q: "The staple content of a manager's message '5 minutes before you leave'?", choices: ["'Great work'", "'Just this one quick thing'", "Praise", "A check-in"], a: 1 },
    { q: "Actual view frequency of an infinite-scroll dashboard?", choices: ["Hourly", "Only its creator, sometimes", "Daily", "Real time"], a: 1 },
    { q: "What actually happens after 'please keep discussion in the thread'?", choices: ["Neatly threaded", "The main channel gets spammed anyway", "Silence", "It ends"], a: 1 },
    { q: "The real audience of an explanation starting 'as you all know'?", choices: ["People who all know", "Something nobody knew", "Experts", "Newbies"], a: 1 },
  ];

  function startQuiz() {
    const SESSION = 10; // questions drawn per play from the 100+ pool
    const pool = (EN() ? QUIZ_EN : QUIZ_KO).slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const session = pool.slice(0, Math.min(SESSION, pool.length));
    let idx = 0;
    let score = 0;
    let locked = false;
    let opts = [];
    const qEl = $("quiz-q");
    const choicesEl = $("quiz-choices");
    const msgEl = $("quiz-msg");

    function render() {
      const item = session[idx];
      $("quiz-info").textContent = `${idx + 1} / ${session.length}`;
      $("quiz-score").textContent = L("점수 ", "Score ") + score;
      qEl.textContent = item.q;
      choicesEl.replaceChildren();
      msgEl.textContent = "";
      locked = false;
      // shuffle choices so the correct answer isn't always in the same slot
      opts = item.choices.map((t, i) => ({ t, correct: i === item.a }));
      for (let i = opts.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      opts.forEach((o) => {
        const b = document.createElement("button");
        b.className = "pixel-btn ghost";
        b.textContent = o.t;
        b.addEventListener("click", () => answer(o, b));
        choicesEl.appendChild(b);
      });
    }

    function answer(o, btn) {
      if (locked) return;
      locked = true;
      const buttons = [...choicesEl.children];
      if (o.correct) {
        score += 100;
        R.sfx.coin();
        btn.style.background = "var(--green)";
        btn.style.color = "#000";
        msgEl.textContent = L("정답! +100", "Correct! +100");
        msgEl.style.color = "var(--green)";
      } else {
        R.sfx.wrong();
        btn.style.background = "var(--red)";
        btn.style.color = "#fff";
        const ci = opts.findIndex((x) => x.correct);
        if (ci >= 0) {
          buttons[ci].style.background = "var(--green)";
          buttons[ci].style.color = "#000";
        }
        msgEl.textContent = L("땡! 직장인의 눈물...", "Wrong! An office worker's tears...");
        msgEl.style.color = "var(--red)";
      }
      setTimeout(() => {
        idx++;
        if (idx >= session.length) return finish();
        render();
      }, 1100);
    }

    function finish() {
      const total = session.length * 100;
      qEl.textContent = L(`퀴즈 종료! 총 ${score}점 / ${total}점`, `Quiz over! ${score} / ${total} pts`);
      choicesEl.replaceChildren();
      const ratio = score / total;
      const grade =
        ratio >= 0.9
          ? L("🏆 만렙 직장인 (짬에서 나오는 바이브)", "🏆 Max-level worker (peak office vibes)")
          : ratio >= 0.6
            ? L("🙂 평범한 회사원", "🙂 Average employee")
            : L("😵 아직 신입 (곧 알게 됩니다)", "😵 Still a rookie (you'll learn soon)");
      msgEl.textContent = grade;
      msgEl.style.color = "var(--amber)";
      R.sfx.win();
    }

    activeCleanup = () => {};
    render();
  }
})();
