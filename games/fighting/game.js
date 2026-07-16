/* 직장인 대전 — 1:1 office fighting engine */
(function () {
  "use strict";
  const R = window.Retro;
  const $ = (id) => document.getElementById(id);
  const FIGHTERS = window.FIGHTERS;

  // i18n helpers
  const T = window.I18N;
  const L = (ko, en) => (T ? T.t(ko, en) : ko);
  const NM = (ch) => L(ch.name, ch.nameEn);
  const TR = (ch) => L(ch.trait, ch.traitEn);
  const SPN = (ch) => L(ch.special.name, ch.special.nameEn);
  const QUOTE = (ch) => L(ch.quote, ch.quoteEn);
  const TAUNT = (ch) => L(ch.taunt || ch.quote, ch.tauntEn || ch.quoteEn);
  const ENDING = (ch) => L(ch.ending, ch.endingEn);
  const UI = {
    cpu: () => L("CPU", "CPU"),
    special: () => L("필살기", "SPECIAL"),
    final: () => L("★ FINAL ★<br>최종 보스", "★ FINAL ★<br>Final Boss"),
    stage: (n, t) => L(`STAGE ${n} / ${t}`, `STAGE ${n} / ${t}`),
    ladder: (dots, n, t) => L(`사다리  ${dots}  (${n}/${t})`, `LADDER  ${dots}  (${n}/${t})`),
    allclear: () => L("★ ALL CLEAR ★", "★ ALL CLEAR ★"),
    endingTitle: (ch) => L(`${NM(ch)} 엔딩`, `${NM(ch)} — ENDING`),
    clearTag: () => L("— 직장인 대전 CLEAR —", "— OFFICE FIGHTER CLEAR —"),
    win: () => L("🏆 WIN!", "🏆 WIN!"),
    beat: (o, next) => L(`${NM(o)}을(를) 꺾었다!<br>다음 상대: <b style="color:var(--red)">${NM(next)}</b> (${TR(next)})`, `You beat ${NM(o)}!<br>Next up: <b style="color:var(--red)">${NM(next)}</b> (${TR(next)})`),
    lose: () => L("💀 YOU LOSE", "💀 YOU LOSE"),
    loseBody: (o, st) => L(`${NM(o)}에게 패배했다…<br>STAGE ${st}에서 탈락.<br>다시 붙어보겠나?`, `Defeated by ${NM(o)}…<br>Eliminated at STAGE ${st}.<br>Try again?`),
    btnRetryRun: () => L("다시 도전", "Play again"),
    btnSelect: () => L("캐릭터 선택", "Select character"),
    btnNext: () => L("다음 상대", "Next opponent"),
    btnRetry: () => L("재도전", "Rematch"),
    p1win: () => L("YOU WIN!", "YOU WIN!"),
    cpuwin: () => L("CPU WINS", "CPU WINS"),
    guard: () => L("가드", "GUARD"),
  };

  const cv = $("game");
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  const W = cv.width, // 360
    H = cv.height, // 200
    GROUND = 172,
    XMIN = 18,
    XMAX = W - 18;

  const ARENA = new Image();
  let arenaReady = false;
  ARENA.onload = () => (arenaReady = true);
  ARENA.src = "img/fight_arena_roof.png";

  // Full-body KOF-style battle sprites (generated). Cached + preloaded per fighter.
  const BATTLE = {};
  function sprAt(src) {
    if (!src) return null;
    let e = BATTLE[src];
    if (!e) {
      const img = new Image();
      e = { img, ready: false };
      img.onload = () => (e.ready = true);
      img.src = src;
      BATTLE[src] = e;
    }
    return e.ready ? e.img : null;
  }
  function battleSprite(ch) {
    return ch ? sprAt(ch.battle) : null;
  }
  function attackSprite(ch) {
    return ch ? sprAt(ch.attack || ch.battle) : null;
  }
  if (Array.isArray(FIGHTERS))
    FIGHTERS.forEach((f) => {
      sprAt(f.battle); // preload idle
      sprAt(f.attack); // preload punch
    });

  /* ============================= fighter art ============================= */
  function fillR(x, y, w, h, col) {
    c.fillStyle = col;
    c.fillRect(x | 0, y | 0, Math.ceil(w), Math.ceil(h));
  }

  function shade(hex, d) {
    const n = parseInt(hex.slice(1), 16);
    let r = R.clamp((n >> 16) + d, 0, 255),
      g = R.clamp(((n >> 8) & 255) + d, 0, 255),
      b = R.clamp((n & 255) + d, 0, 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Paint one fighter body. `force` (color) overrides every part → used for outline passes.
  // Local coords face RIGHT; mirrored for face<0. lx from center, ly from ground (up = negative).
  function paintBody(ch, x, gy, face, act, t, force) {
    const suit = ch.suit,
      suitD = shade(suit, -30),
      suitL = shade(suit, 22),
      skin = ch.skin,
      skinD = shade(skin, -26),
      skinL = shade(skin, 16),
      shirt = "#eef2f8",
      shirtD = "#b9c4d6",
      tie = ch.tie,
      tieD = shade(tie, -34),
      shoe = "#15111a",
      hairC = ch.hair === "bald" ? skin : ch.hair,
      hairD = ch.hair === "bald" ? skinD : shade(ch.hair, -28);

    const P = (lx, ly, w, h, col) => {
      const rx = face > 0 ? x + lx : x - lx - w;
      c.fillStyle = force || col;
      c.fillRect(Math.round(rx), Math.round(gy + ly), Math.ceil(w), Math.ceil(h));
    };

    if (act === "ko") {
      P(-18, -8, 34, 8, suit);
      P(-18, -8, 34, 3, suitL);
      P(11, -14, 14, 13, skin);
      if (ch.hair === "bald") {
        P(11, -14, 14, 4, skinL);
      } else {
        P(10, -16, 15, 5, hairC);
      }
      P(15, -10, 2, 2, "#1a1010"); // X-ish eye
      P(19, -10, 2, 2, "#1a1010");
      return;
    }

    const bulky = ch.id === "seo" || ch.id === "boss";
    const bob = act === "walk" ? Math.round(Math.sin(t * 12) * 1.4) : act === "idle" ? Math.round(Math.sin(t * 3) * 0.8) : 0;
    const cr = act === "block" ? 5 : 0; // crouch
    const swing = act === "walk" ? Math.round(Math.sin(t * 12) * 3) : 0;

    /* ---- legs & shoes ---- */
    P(-7, -28 + cr, 6, 24 - cr, suitD); // back leg
    P(-9 - (swing < 0 ? -swing : 0), -4, 10, 4, shoe);
    P(0, -28 + cr, 7, 24 - cr, suit); // front leg
    P(1 + (swing > 0 ? swing : 0), -4, 11, 4, shoe);
    P(1 + (swing > 0 ? swing : 0), -4, 11, 1, shade(shoe, 20));

    /* ---- hips / belt ---- */
    P(-8, -32 + cr, 16, 6, suitD);
    P(-8, -31 + cr, 16, 1, "#2b2b33");

    /* ---- torso (jacket) ---- */
    const ty = -50 + cr + bob;
    const tw = bulky ? 20 : 17;
    P(-tw / 2, ty, tw, 20, suit);
    P(-tw / 2, ty, 4, 20, suitD); // back shadow
    P(tw / 2 - 3, ty, 3, 18, suitL); // front highlight edge
    // shirt V + collar + tie
    P(-2, ty + 1, 6, 13, shirt);
    P(-2, ty + 1, 2, 12, shirtD);
    P(-4, ty, 9, 2, shirt); // collar
    P(0, ty + 2, 3, 13, tie);
    P(-1, ty, 4, 3, tieD); // knot
    // lapels
    P(-4, ty, 3, 7, suitL);
    P(2, ty, 3, 7, suitD);

    /* ---- back arm ---- */
    P(-tw / 2 - 2, ty + 1, 4, 13, suitD);
    P(-tw / 2 - 2, ty + 13, 4, 4, skinD);

    /* ---- head ---- */
    const hy = ty - 15;
    P(-2, hy + 13, 5, 3, skinD); // neck
    P(-6, hy, 13, 14, skin); // face
    P(-6, hy + 11, 13, 3, skinD); // jaw shadow
    P(3, hy + 2, 3, 8, skinL); // front cheek light
    P(-6, hy + 4, 2, 4, skinD); // back ear
    // features (facing front/right)
    P(-5, hy + 8, 2, 3, hairD); // sideburn
    P(2, hy + 4, 2, 3, "#241612"); // eye
    P(2, hy + 3, 3, 1, hairD); // brow
    P(6, hy + 5, 1, 4, skinD); // nose profile
    P(2, hy + 10, 4, 1, "#7c3f30"); // mouth
    // hair
    if (ch.hair === "bald") {
      P(-6, hy, 13, 5, skinL); // shiny dome
      P(-6, hy, 13, 2, shade(skin, 30));
      P(-3, hy, 5, 1, "#ffffffcc"); // shine
      P(-6, hy + 4, 2, 6, "#5b4a36"); // side hair
      P(5, hy + 4, 2, 4, "#5b4a36");
    } else {
      P(-7, hy - 3, 15, 7, hairC); // hair cap
      P(-7, hy - 3, 15, 2, shade(ch.hair, 26)); // top light
      P(-7, hy + 2, 3, 7, hairC); // back
      P(4, hy - 2, 4, 5, hairC); // front bang
      P(5, hy - 1, 3, 3, hairD);
    }

    /* ---- per-character accessory ---- */
    if (ch.id === "han") {
      // IT headset
      P(-7, hy + 1, 15, 2, "#1b1b22");
      P(-7, hy + 1, 2, 6, "#1b1b22");
      P(-8, hy + 5, 2, 3, "#43d9e6");
    }
    if (ch.id === "kang") {
      // sharp glasses
      P(2, hy + 4, 5, 2, "#0c0c10");
    }
    if (ch.id === "yoon") {
      // trendy fringe highlight
      P(4, hy - 2, 4, 2, "#a9714f");
    }

    /* ---- front arm (action dependent) ---- */
    const sy = ty + 1;
    if (act === "block") {
      P(4, sy - 4, 6, 17, skin); // forearm guard up
      P(4, sy - 4, 6, 3, skinL);
      P(3, sy + 9, 7, 5, suit); // upper arm
    } else if (act === "light" || act === "heavy" || act === "special") {
      const reach = act === "light" ? 15 : act === "heavy" ? 22 : 27;
      const armY = sy + 3 - (act === "heavy" ? 2 : 0);
      P(tw / 2 - 2, armY, reach - 5, 5, suit); // upper arm sleeve
      P(tw / 2 - 2, armY, reach - 5, 2, suitL);
      P(tw / 2 - 2 + reach - 6, armY - 1, 7, 7, skin); // fist
      P(tw / 2 - 2 + reach - 6, armY - 1, 7, 2, skinL);
      if (bulky) P(tw / 2 - 2, armY - 1, 6, 7, skin); // biceps
    } else {
      P(tw / 2 - 2, sy + 1, 5, 13, suit); // relaxed front arm
      P(tw / 2 - 2, sy + 1, 5, 2, suitL);
      P(tw / 2 - 1, sy + 13, 4, 4, skin); // hand
    }
    if (bulky && act !== "block") {
      P(tw / 2 - 3, sy, 4, 6, suit); // shoulder pad
      P(-tw / 2 - 1, sy, 3, 5, suitD);
    }
  }

  // Draw fighter with a dark sticker outline (8-way offset passes) for crisp DOS-sprite edges.
  const OUTLINE = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
  ];
  function drawFighter(ch, x, gy, face, act, t) {
    // soft shadow on the ground
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.beginPath();
    c.ellipse(x, gy + 1, 16, 4, 0, 0, Math.PI * 2);
    c.fill();

    // use the dedicated punch/attack pose during strikes for real motion
    const striking = act === "light" || act === "heavy" || act === "special";
    const spr = striking ? attackSprite(ch) : battleSprite(ch);
    if (spr) {
      drawBattleSprite(spr, ch, x, gy, face, act, t);
      return;
    }
    // fallback: procedural body
    for (const [ox, oy] of OUTLINE) paintBody(ch, x + ox, gy + oy, face, act, t, "#0a0608");
    paintBody(ch, x, gy, face, act, t, null);
  }

  // offscreen scratch for per-sprite tinting (so flashes don't hit the bg)
  const scratch = document.createElement("canvas");
  scratch.width = 256;
  scratch.height = 256;
  const sctx = scratch.getContext("2d");

  // Render a full-body sprite, feet at (x, gy), flipped by facing, with
  // action-based transforms that fake KOF-style animation.
  const SPRITE_H = 108; // on-canvas height (px)
  function drawBattleSprite(img, ch, x, gy, face, act, t) {
    const ar = img.width / img.height;
    const h = SPRITE_H;
    const w = h * ar;
    let lean = 0, // horizontal shift toward the front (attacks) / back (hit)
      squash = 1, // vertical scale
      stretch = 1, // horizontal scale
      tint = null,
      tintA = 0,
      dy = 0,
      rot = 0;

    if (act === "light") {
      lean = 9;
      stretch = 1.05;
    } else if (act === "heavy") {
      lean = 15;
      stretch = 1.08;
      squash = 0.98;
    } else if (act === "special") {
      const p = Math.abs(Math.sin(t * 12));
      stretch = 1.06 + 0.06 * p;
      squash = 1.04 + 0.04 * p;
      tint = ch.special.color;
      tintA = 0.3 + 0.25 * p;
    } else if (act === "block") {
      squash = 0.9;
      stretch = 0.93;
      dy = 2;
      tint = "#43d9e6";
      tintA = 0.2;
    } else if (act === "hit") {
      lean = -7; // knocked back, opposite of facing
      stretch = 1.02;
      tint = "#ff2a2a";
      tintA = 0.5;
    } else if (act === "ko") {
      // topple over onto the ground
      rot = 1.35;
      dy = 6;
      tint = "#7a1010";
      tintA = 0.4;
    } else if (act === "walk") {
      dy = Math.abs(Math.sin(t * 12)) * -2;
    } else {
      // idle breathing
      dy = Math.sin(t * 4) * 1.2;
      squash = 1 + Math.sin(t * 4) * 0.015;
    }

    const dw = Math.min(w * stretch, scratch.width);
    const dh = Math.min(h * squash, scratch.height);

    // compose sprite (+ optional tint) onto the offscreen scratch
    sctx.clearRect(0, 0, dw, dh);
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(img, 0, 0, dw, dh);
    if (tint && tintA > 0) {
      sctx.globalCompositeOperation = "source-atop";
      sctx.globalAlpha = tintA;
      sctx.fillStyle = tint;
      sctx.fillRect(0, 0, dw, dh);
      sctx.globalAlpha = 1;
      sctx.globalCompositeOperation = "source-over";
    }

    c.save();
    c.imageSmoothingEnabled = false;
    c.translate(x + face * lean, gy + dy);
    c.scale(face, 1);
    if (rot) c.rotate(rot); // pivot at feet → topple forward
    c.drawImage(scratch, 0, 0, dw, dh, -dw / 2, -dh, dw, dh);
    c.restore();
  }

  // Portrait bust for select screen (own canvas ctx) — shaded + outlined.
  function drawPortrait(ctx, ch, w, h) {
    ctx.imageSmoothingEnabled = false;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, shade(ch.suit, -36));
    g.addColorStop(1, "#0a0304");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2,
      sc = w / 46;
    const suitL = shade(ch.suit, 22),
      suitD = shade(ch.suit, -30),
      skinD = shade(ch.skin, -24),
      skinL = shade(ch.skin, 16);
    const paint = (force) => {
      const P = (lx, ly, ww, hh, col) => {
        ctx.fillStyle = force || col;
        ctx.fillRect(Math.round(cx + lx * sc), Math.round(ly * sc), Math.ceil(ww * sc), Math.ceil(hh * sc));
      };
      // shoulders / jacket
      P(-17, 30, 34, 22, ch.suit);
      P(-17, 30, 5, 22, suitD);
      P(12, 30, 5, 22, suitL);
      // shirt + tie
      P(-4, 30, 8, 20, "#eef2f8");
      P(-2, 31, 4, 19, ch.tie);
      P(-3, 30, 6, 3, shade(ch.tie, -34));
      // lapels
      P(-6, 30, 4, 10, suitL);
      P(3, 30, 4, 10, suitD);
      // neck + head
      P(-4, 26, 8, 6, skinD);
      P(-11, 6, 22, 24, ch.skin);
      P(-11, 22, 22, 4, skinD); // jaw
      P(5, 10, 5, 12, skinL); // cheek light
      // features
      P(-6, 15, 3, 4, "#241612");
      P(3, 15, 3, 4, "#241612");
      P(-7, 13, 5, 2, ch.hair === "bald" ? "#5b4a36" : shade(ch.hair, -20));
      P(2, 13, 5, 2, ch.hair === "bald" ? "#5b4a36" : shade(ch.hair, -20));
      P(-2, 24, 6, 1, "#7c3f30");
      // hair
      if (ch.hair === "bald") {
        P(-11, 6, 22, 6, skinL);
        P(-11, 6, 22, 2, shade(ch.skin, 30));
        P(-4, 7, 6, 1, "#ffffffcc");
        P(-11, 11, 3, 8, "#5b4a36");
        P(8, 11, 3, 8, "#5b4a36");
      } else {
        P(-12, 2, 24, 10, ch.hair);
        P(-12, 2, 24, 3, shade(ch.hair, 26));
        P(-12, 9, 3, 10, ch.hair);
        P(9, 9, 3, 10, ch.hair);
      }
      if (ch.id === "han") {
        P(-12, 8, 24, 2, "#1b1b22");
        P(-13, 12, 2, 5, "#43d9e6");
      }
      if (ch.id === "kang") P(3, 15, 8, 3, "#0c0c10");
    };
    // outline passes
    for (const [ox, oy] of OUTLINE) {
      ctx.save();
      ctx.translate(ox, oy);
      paint("#0a0608");
      ctx.restore();
    }
    paint(null);
  }

  /* ============================= select screen ============================= */
  const roster = $("roster");
  FIGHTERS.forEach((ch) => {
    const card = document.createElement("div");
    card.className = "fighter-card";
    // generated portrait art, with procedural fallback canvas if it fails to load
    const img = new Image();
    img.alt = NM(ch);
    img.src = ch.battle || ch.art;
    img.onerror = () => {
      const pc = document.createElement("canvas");
      pc.width = 88;
      pc.height = 118;
      drawPortrait(pc.getContext("2d"), ch, 88, 118);
      img.replaceWith(pc);
    };
    const nm = document.createElement("div");
    nm.className = "nm";
    nm.textContent = NM(ch);
    const tr = document.createElement("div");
    tr.className = "tr";
    tr.textContent = TR(ch);
    const mv = document.createElement("div");
    mv.className = "movelist";
    mv.innerHTML = `${UI.special()}<br>★ ${SPN(ch)}`;
    card.append(img, nm, tr, mv);
    card.addEventListener("mouseenter", () => R.sfx.select());
    card.addEventListener("click", () => {
      R.sfx.confirm();
      beginArcade(ch);
    });
    roster.appendChild(card);
  });

  /* ============================= arcade ladder ============================= */
  const byId = (id) => FIGHTERS.find((f) => f.id === id);
  let run = null;

  function beginArcade(playerCh) {
    const finalBossId = playerCh.id === "kang" ? "boss" : "kang";
    const pool = window.LADDER.filter((id) => id !== playerCh.id && id !== finalBossId);
    // shuffle pool, take 4, then final boss
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const opponents = pool.slice(0, 4).map(byId);
    opponents.push(byId(finalBossId));
    run = { playerCh, opponents, stage: 0 };
    $("select").classList.add("hidden");
    showVS();
  }

  function showVS() {
    const p = run.playerCh;
    const o = run.opponents[run.stage];
    const last = run.stage === run.opponents.length - 1;
    $("vs-p1-img").src = p.battle || p.art;
    $("vs-p2-img").src = o.battle || o.art;
    $("vs-p1-name").textContent = NM(p);
    $("vs-p2-name").textContent = NM(o);
    $("vs-p1-quote").textContent = QUOTE(p);
    $("vs-p2-quote").textContent = TAUNT(o);
    $("vs-stage").innerHTML = last ? UI.final() : UI.stage(run.stage + 1, run.opponents.length);
    $("battle").classList.add("hidden");
    $("result").classList.add("hidden");
    $("vs").classList.remove("hidden");
    R.sfx.confirm();
  }

  $("vs-go").addEventListener("click", () => {
    R.sfx.confirm();
    $("vs").classList.add("hidden");
    startMatch(run.playerCh, run.opponents[run.stage]);
  });

  /* ============================= battle state ============================= */
  let M = null;
  let loop = null;

  function mkFighter(ch, x, face) {
    return {
      ch,
      x,
      face,
      vx: 0,
      vy: 0,
      onGround: true,
      hp: ch.hp,
      maxhp: ch.hp,
      mp: 0,
      act: "idle",
      actT: 0,
      cd: 0,
      hitDone: false,
      hitstun: 0,
      blocking: false,
      ko: false,
      aiT: R.rand(0.3, 0.8),
      aiState: "approach",
      animT: 0,
    };
  }

  function startMatch(playerCh, cpuCh) {
    // final-boss CPU is tougher
    const isFinal = run && run.stage === run.opponents.length - 1;
    M = {
      p1: mkFighter(playerCh, W * 0.3, 1),
      p2: mkFighter(cpuCh, W * 0.7, -1),
      wins: [0, 0],
      round: 1,
      projectiles: [],
      fx: [],
      state: "intro",
      stateT: 1.6,
      banner: `ROUND 1`,
      over: false,
      shake: 0,
      cpuSkill: isFinal ? 1.35 : 0.7 + run.stage * 0.13,
    };
    $("select").classList.add("hidden");
    $("vs").classList.add("hidden");
    $("battle").classList.remove("hidden");
    $("result").classList.add("hidden");
    $("p1-name").textContent = NM(playerCh);
    $("p2-name").textContent = NM(cpuCh) + " (" + UI.cpu() + ")";
    if (run) {
      const dots = run.opponents.map((o, i) => (i < run.stage ? "●" : i === run.stage ? "◆" : "○")).join(" ");
      $("ladder-hud").textContent = UI.ladder(dots, run.stage + 1, run.opponents.length);
    }
    if (loop) loop.stop();
    loop = R.loop(update, render);
  }

  function resetRound() {
    M.p1.x = W * 0.3;
    M.p1.face = 1;
    M.p1.hp = M.p1.maxhp;
    M.p1.act = "idle";
    M.p1.vx = M.p1.vy = 0;
    M.p1.ko = false;
    M.p1.hitstun = 0;
    M.p2.x = W * 0.7;
    M.p2.face = -1;
    M.p2.hp = M.p2.maxhp;
    M.p2.act = "idle";
    M.p2.vx = M.p2.vy = 0;
    M.p2.ko = false;
    M.p2.hitstun = 0;
    M.projectiles = [];
    M.fx = [];
    M.state = "intro";
    M.stateT = 1.2;
    M.banner = `ROUND ${M.round}`;
  }

  /* ============================= input ============================= */
  const IN = { left: false, right: false, up: false, block: false, q: {} };
  function press(k) {
    if (k === "left" || k === "right" || k === "up" || k === "block") IN[k] = true;
    else IN.q[k] = true;
  }
  function release(k) {
    if (k in IN) IN[k] = false;
  }
  const KEYMAP = { arrowleft: "left", a: "left", arrowright: "right", d: "right", arrowup: "up", w: "up", j: "light", k: "heavy", l: "block", u: "special" };
  // Map by physical key (e.code) too, so attacks still work when a Korean/other
  // IME is active (which makes e.key return composed jamo like "ㅓ" instead of "j").
  const CODEMAP = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "up", KeyW: "up", KeyJ: "light", KeyK: "heavy", KeyL: "block", KeyU: "special" };
  const mapKey = (e) => CODEMAP[e.code] || KEYMAP[(e.key || "").toLowerCase()];
  const down = new Set();
  window.addEventListener("keydown", (e) => {
    const k = mapKey(e);
    if (!k) return;
    e.preventDefault();
    if (!down.has(k)) {
      down.add(k);
      press(k);
    }
  });
  window.addEventListener("keyup", (e) => {
    const k = mapKey(e);
    if (!k) return;
    down.delete(k);
    release(k);
  });
  document.querySelectorAll("#controls [data-k]").forEach((b) => {
    const k = b.dataset.k;
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      press(k);
    });
    b.addEventListener("pointerup", (e) => {
      e.preventDefault();
      release(k);
    });
    b.addEventListener("pointerleave", () => release(k));
    b.addEventListener("pointercancel", () => release(k));
  });

  /* ============================= combat helpers ============================= */
  const DUR = { light: 0.26, heavy: 0.44, special: 0.6 };
  const ACTIVE = { light: [0.06, 0.15], heavy: [0.12, 0.26], special: [0.14, 0.34] };
  const DMG = { light: 5, heavy: 11, special: 22 };

  function tryAttack(f, kind) {
    if (f.cd > 0 || f.hitstun > 0 || f.ko) return false;
    if (f.act === "light" || f.act === "heavy" || f.act === "special") return false;
    if (kind === "special" && f.mp < 100) return false;
    f.act = kind;
    f.actT = 0;
    f.hitDone = false;
    f.vx = 0;
    if (kind === "special") {
      f.mp = 0;
      R.sfx.win();
      const sp = f.ch.special;
      if (sp.type === "lunge") f.vx = f.face * 220;
      if (sp.type === "projectile") {
        M.projectiles.push({ x: f.x + f.face * 18, y: GROUND - 30, vx: f.face * 200, owner: f, life: 2, col: sp.color, dmg: DMG.special * f.ch.pw });
      }
    } else {
      // small step-in so a normal strike closes the last bit of gap
      f.vx = f.face * (kind === "heavy" ? 150 : 110);
      R.sfx.hit();
    }
    return true;
  }

  function hitbox(f) {
    // returns {x,y,w,h} in front of fighter during active window, else null.
    // Reach is sized to the ~72px-wide battle sprites so strikes land at
    // visually-adjacent range (previously tuned for tiny procedural bodies).
    const a = ACTIVE[f.act];
    if (!a) return null;
    if (f.actT < a[0] || f.actT > a[1]) return null;
    const reach = f.act === "light" ? 32 : f.act === "heavy" ? 44 : 52;
    const x = f.face > 0 ? f.x + 8 : f.x - 8 - reach;
    return { x, y: GROUND - 48, w: reach, h: 42 };
  }
  function bodybox(f) {
    return { x: f.x - 18, y: GROUND - 48, w: 36, h: 48 };
  }
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function applyHit(att, def, dmg, kind) {
    const blocked = def.blocking && def.hitstun <= 0 && facingEachOther(def, att);
    if (blocked) {
      def.hp -= dmg * 0.18;
      def.hitstun = 0.16;
      def.vx = att.face * 40;
      def.mp = Math.min(100, def.mp + 6);
      R.sfx.wrong();
      spawnFx(def.x + def.face * 8, GROUND - 26, "#43d9e6", UI.guard());
    } else {
      def.hp -= dmg;
      def.hitstun = kind === "special" ? 0.5 : kind === "heavy" ? 0.34 : 0.2;
      def.act = "hit";
      def.actT = 0;
      def.vx = att.face * (kind === "special" ? 180 : kind === "heavy" ? 120 : 70);
      att.mp = Math.min(100, att.mp + (kind === "heavy" ? 16 : kind === "special" ? 0 : 10));
      def.mp = Math.min(100, def.mp + 6);
      R.sfx.hurt();
      M.shake = kind === "special" ? 7 : kind === "heavy" ? 4 : 2;
      spawnFx(def.x, GROUND - 30, kind === "special" ? att.ch.special.color : "#ffd54a", kind === "special" ? "★" : "");
    }
    if (def.hp <= 0) {
      def.hp = 0;
      def.ko = true;
      def.act = "ko";
    }
  }
  function facingEachOther(def, att) {
    return (att.x > def.x && def.face < 0) || (att.x < def.x && def.face > 0);
  }

  function spawnFx(x, y, col, text) {
    M.fx.push({ x, y, col, text, life: text === "★" ? 0.6 : 0.35, vy: -30 });
  }

  /* ============================= update ============================= */
  function update(dt) {
    if (!M) return;
    if (M.shake > 0) M.shake = Math.max(0, M.shake - dt * 40);

    if (M.state === "intro") {
      M.stateT -= dt;
      if (M.stateT <= 0) {
        M.state = "fight";
        M.banner = "FIGHT!";
        M.stateT = 0.8;
      }
      IN.q = {};
      return;
    }
    if (M.state === "fight" && M.stateT > 0) M.stateT -= dt;
    if (M.state === "roundend") {
      M.stateT -= dt;
      if (M.stateT <= 0) {
        if (M.wins[0] >= 2 || M.wins[1] >= 2) return endMatch();
        M.round++;
        resetRound();
      }
      return;
    }

    stepPlayer(M.p1, dt);
    stepCPU(M.p2, dt);
    stepFighter(M.p1, M.p2, dt);
    stepFighter(M.p2, M.p1, dt);
    stepProjectiles(dt);

    // face each other when idle-ish
    faceUpdate(M.p1, M.p2);
    faceUpdate(M.p2, M.p1);

    // KO check → round end
    if (M.state === "fight" && (M.p1.ko || M.p2.ko)) {
      const p1win = M.p2.ko && !M.p1.ko;
      const p2win = M.p1.ko && !M.p2.ko;
      if (p1win || p2win) {
        M.wins[p1win ? 0 : 1]++;
        M.banner = p1win ? UI.p1win() : UI.cpuwin();
        M.state = "roundend";
        M.stateT = 2.2;
      }
    }

    IN.q = {};
    updateBars();
  }

  function faceUpdate(f, o) {
    if (f.act === "idle" || f.act === "walk") f.face = o.x >= f.x ? 1 : -1;
  }

  function stepPlayer(f, dt) {
    if (M.state !== "fight" || f.ko) return;
    f.blocking = IN.block && f.onGround;
    const canMove = f.hitstun <= 0 && !["light", "heavy", "special", "hit"].includes(f.act) && !f.blocking;
    if (canMove) {
      if (IN.left) {
        f.vx = -70 * f.ch.sp;
        if (f.onGround) f.act = "walk";
      } else if (IN.right) {
        f.vx = 70 * f.ch.sp;
        if (f.onGround) f.act = "walk";
      } else {
        f.vx = 0;
        if (f.onGround && f.act === "walk") f.act = "idle";
      }
      if (IN.up && f.onGround) {
        f.vy = -220;
        f.onGround = false;
        f.act = "idle";
      }
    }
    if (IN.q.light) tryAttack(f, "light");
    if (IN.q.heavy) tryAttack(f, "heavy");
    if (IN.q.special) tryAttack(f, "special");
  }

  function stepCPU(f, dt) {
    if (M.state !== "fight" || f.ko) return;
    const o = M.p1;
    const dx = o.x - f.x;
    const dist = Math.abs(dx);
    const sk = M.cpuSkill || 0.8;
    f.aiT -= dt * (0.7 + sk * 0.5);
    f.blocking = false;
    const busy = ["light", "heavy", "special", "hit"].includes(f.act) || f.hitstun > 0;

    // block incoming attacks sometimes (smarter opponents block more)
    if (!busy && (o.act === "heavy" || o.act === "special") && dist < 40 && Math.random() < 0.32 * sk) {
      f.blocking = true;
      f.vx = 0;
      return;
    }
    if (f.mp >= 100 && dist < 64 && Math.random() < 0.03 * sk) {
      tryAttack(f, "special");
      return;
    }
    if (!busy) {
      if (dist > 44) {
        f.vx = Math.sign(dx) * 60 * f.ch.sp;
        if (f.onGround) f.act = "walk";
        // occasional jump-in
        if (f.onGround && Math.random() < 0.006) {
          f.vy = -210;
          f.onGround = false;
        }
      } else {
        f.vx = 0;
        if (f.act === "walk") f.act = "idle";
        if (f.aiT <= 0) {
          f.aiT = R.rand(0.4, 1.0);
          const r = Math.random();
          if (r < 0.5) tryAttack(f, "light");
          else if (r < 0.8) tryAttack(f, "heavy");
          else f.blocking = true;
        }
      }
    }
  }

  function stepFighter(f, opp, dt) {
    f.animT += dt;
    if (f.hitstun > 0) f.hitstun -= dt;
    if (f.cd > 0) f.cd -= dt;
    if (f.mp < 100 && M.state === "fight") f.mp = Math.min(100, f.mp + dt * 5); // passive meter

    // action timers
    if (["light", "heavy", "special"].includes(f.act)) {
      f.actT += dt;
      const hb = hitbox(f);
      if (hb && !f.hitDone) {
        // only the projectile *special* skips melee; light/heavy always melee
        const isProjSpecial = f.act === "special" && f.ch.special.type === "projectile";
        if (!isProjSpecial && overlap(hb, bodybox(opp)) && !opp.ko) {
          const kind = f.act;
          applyHit(f, opp, DMG[kind] * f.ch.pw * (kind === "special" ? aoeMul(f) : 1), kind);
          f.hitDone = true;
        }
      }
      if (f.actT >= DUR[f.act]) {
        f.act = "idle";
        f.cd = 0.08;
      }
    } else if (f.act === "hit") {
      f.actT += dt;
      if (f.actT > 0.24 && f.hitstun <= 0) f.act = "idle";
    }

    // physics
    f.x += f.vx * dt;
    if (["light", "heavy"].includes(f.act)) f.vx *= 0.6;
    else if (f.act === "special") f.vx *= 0.86;
    else f.vx *= f.onGround ? 0.7 : 0.98;
    // vertical jump via yOff (negative = airborne)
    if (!f.onGround) f.vy += 620 * dt;
    f.yOff = (f.yOff || 0) + f.vy * dt;
    if (f.yOff >= 0) {
      f.yOff = 0;
      f.vy = 0;
      f.onGround = true;
    }
    f.x = R.clamp(f.x, XMIN, XMAX);

    // prevent overlap push (spacing matches the ~72px sprites so they don't
    // clip through each other, while staying inside light-attack reach)
    const d = f.x - opp.x;
    if (Math.abs(d) < 30 && f.onGround && opp.onGround) {
      const push = (30 - Math.abs(d)) / 2;
      f.x += Math.sign(d || 1) * push * 0.5;
    }
  }

  function aoeMul(f) {
    return f.ch.special.type === "aoe" ? 1 : 1;
  }

  function stepProjectiles(dt) {
    for (const p of M.projectiles) {
      p.x += p.vx * dt;
      p.life -= dt;
      const target = p.owner === M.p1 ? M.p2 : M.p1;
      if (!target.ko && overlap({ x: p.x - 6, y: p.y - 6, w: 12, h: 24 }, bodybox(target))) {
        applyHit(p.owner, target, p.dmg, "special");
        p.life = 0;
      }
    }
    // aoe & lunge specials: handle burst for aoe at active frame
    for (const f of [M.p1, M.p2]) {
      if (f.act === "special" && f.ch.special.type === "aoe" && !f.hitDone) {
        const a = ACTIVE.special;
        if (f.actT >= a[0] && f.actT <= a[1]) {
          const o = f === M.p1 ? M.p2 : M.p1;
          if (!o.ko && Math.abs(o.x - f.x) < 58) {
            applyHit(f, o, DMG.special * f.ch.pw, "special");
            f.hitDone = true;
          }
          spawnFx(f.x, GROUND - 24, f.ch.special.color, "");
        }
      }
    }
    M.projectiles = M.projectiles.filter((p) => p.life > 0 && p.x > -20 && p.x < W + 20);
    for (const fx of M.fx) {
      fx.life -= dt;
      fx.y += fx.vy * dt;
    }
    M.fx = M.fx.filter((fx) => fx.life > 0);
  }

  function updateBars() {
    $("p1-hp").style.width = (M.p1.hp / M.p1.maxhp) * 100 + "%";
    $("p2-hp").style.width = (M.p2.hp / M.p2.maxhp) * 100 + "%";
    $("p1-mp").style.width = M.p1.mp + "%";
    $("p2-mp").style.width = M.p2.mp + "%";
    $("round-dots").textContent = `${"●".repeat(M.wins[0])}${"○".repeat(Math.max(0, 2 - M.wins[0]))} R${M.round} ${"○".repeat(Math.max(0, 2 - M.wins[1]))}${"●".repeat(M.wins[1])}`;
    const sp = $("btn-sp");
    if (sp) sp.style.background = M.p1.mp >= 100 ? "var(--magenta)" : "var(--ink-dim)";
  }

  /* ============================= render ============================= */
  function render() {
    if (!M) return;
    c.save();
    if (M.shake > 0) c.translate(R.rand(-M.shake, M.shake), R.rand(-M.shake, M.shake));
    // background: generated VGA rooftop arena (with procedural fallback)
    if (arenaReady) {
      c.drawImage(ARENA, -1, -1, W + 2, H + 2);
    } else {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#3a1e46");
      g.addColorStop(1, "#0c0406");
      c.fillStyle = g;
      c.fillRect(-10, -10, W + 20, H + 20);
      c.fillStyle = "#241018";
      c.fillRect(-10, GROUND, W + 20, H - GROUND + 10);
    }

    // special aura behind the attacking fighter
    for (const f of [M.p1, M.p2]) {
      if (f.act === "special") {
        const pulse = 26 + Math.sin(M.p1.animT * 30) * 6;
        const rg = c.createRadialGradient(f.x, GROUND - 24, 4, f.x, GROUND - 24, pulse);
        rg.addColorStop(0, f.ch.special.color + "cc");
        rg.addColorStop(1, f.ch.special.color + "00");
        c.fillStyle = rg;
        c.fillRect(f.x - pulse, GROUND - 24 - pulse, pulse * 2, pulse * 2);
      }
    }

    // fighters (draw back-most by x for slight depth)
    const order = M.p1.x <= M.p2.x ? [M.p1, M.p2] : [M.p2, M.p1];
    for (const f of order) {
      drawFighter(f.ch, f.x, GROUND + (f.yOff || 0), f.face, f.blocking && f.act === "idle" ? "block" : f.act, f.animT);
    }

    // projectiles
    for (const p of M.projectiles) {
      fillR(p.x - 6, p.y - 6, 12, 12, p.col);
      fillR(p.x - 3, p.y - 9, 6, 3, "#fff");
    }
    // fx
    for (const fx of M.fx) {
      if (fx.text) R.pixelText(c, fx.text, fx.x, fx.y, fx.text === "★" ? 16 : 8, fx.col, "center");
      else {
        c.globalAlpha = R.clamp(fx.life * 3, 0, 1);
        fillR(fx.x - 8, fx.y - 8, 16, 16, fx.col);
        c.globalAlpha = 1;
      }
    }

    // banner
    if (M.stateT > 0 && M.banner) {
      c.globalAlpha = R.clamp(M.stateT, 0, 1);
      R.pixelText(c, M.banner, W / 2, H / 2 - 24, 18, "#ffd54a", "center");
      c.globalAlpha = 1;
      if (M.state === "intro") R.pixelText(c, QUOTE(M.p1.ch), W / 2, H / 2 + 4, 8, "#e7ecff", "center");
    }
    c.restore();
  }

  /* ============================= end ============================= */
  let resultMode = null; // "advance" | "ending" | "defeat"

  function endMatch() {
    M.over = true;
    if (loop) loop.stop();
    const win = M.wins[0] >= 2;
    const last = run.stage === run.opponents.length - 1;
    const portrait = $("result-portrait");

    if (win && last) {
      // full arcade clear → character ending
      resultMode = "ending";
      R.sfx.win();
      portrait.src = run.playerCh.battle || run.playerCh.art;
      portrait.classList.remove("hidden");
      $("result-title").innerHTML = UI.allclear();
      $("result-body").innerHTML =
        `<b style="color:var(--amber)">${UI.endingTitle(run.playerCh)}</b><br><br>${ENDING(run.playerCh)}<br><br><span style="color:var(--cyan)">${UI.clearTag()}</span>`;
      setButtons(UI.btnRetryRun(), UI.btnSelect(), restartRun, backToSelect);
    } else if (win) {
      // advance to next opponent
      resultMode = "advance";
      R.sfx.win();
      portrait.classList.add("hidden");
      const next = run.opponents[run.stage + 1];
      $("result-title").innerHTML = UI.win();
      $("result-body").innerHTML = UI.beat(M.p2.ch, next);
      setButtons(UI.btnNext(), UI.btnSelect(), advanceStage, backToSelect);
    } else {
      // defeat
      resultMode = "defeat";
      R.sfx.lose();
      portrait.classList.add("hidden");
      $("result-title").innerHTML = UI.lose();
      $("result-body").innerHTML = UI.loseBody(M.p2.ch, run.stage + 1);
      setButtons(UI.btnRetry(), UI.btnSelect(), retryStage, backToSelect);
    }
    $("result").classList.remove("hidden");
  }

  function setButtons(primaryText, secondaryText, primaryFn, secondaryFn) {
    const pb = $("result-primary");
    const sb = $("result-secondary");
    pb.textContent = primaryText;
    sb.textContent = secondaryText;
    pb.onclick = () => {
      R.sfx.confirm();
      primaryFn();
    };
    sb.onclick = () => {
      R.sfx.confirm();
      secondaryFn();
    };
  }

  function advanceStage() {
    run.stage++;
    showVS();
  }
  function retryStage() {
    startMatch(run.playerCh, run.opponents[run.stage]);
  }
  function restartRun() {
    run.stage = 0;
    showVS();
  }
  function backToSelect() {
    $("result").classList.add("hidden");
    $("battle").classList.add("hidden");
    $("vs").classList.add("hidden");
    $("select").classList.remove("hidden");
    if (loop) loop.stop();
    M = null;
    run = null;
  }
})();
