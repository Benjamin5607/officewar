/* 오피스 던전 — top-down action RPG (DOS-era pixel look) */
(function () {
  "use strict";
  const R = window.Retro;
  const T = window.I18N;
  const L = (ko, en) => (T ? T.t(ko, en) : ko);
  const $ = (id) => document.getElementById(id);
  const cv = $("game");
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  const W = cv.width, // 240
    H = cv.height;
  const WALL = 16; // wall thickness

  const ROOMBG = new Image();
  let bgReady = false;
  ROOMBG.onload = () => (bgReady = true);
  ROOMBG.src = "img/rpg_dungeon_room.png";

  /* ------------------------------ sprites ------------------------------ */
  const P = {
    k: "#0c0c12", // outline / black
    s: "#e7ecff",
    S: "#3f66ad", // suit
    D: "#2a4374", // suit shadow
    L: "#5f86cd", // suit light
    t: "#c0392b", // tie
    f: "#f0c8a0", // skin
    F: "#f7dcb4", // skin light
    e: "#c99f76", // skin shadow
    h: "#4a3320", // hair
    m: "#8a1111",
    g: "#57e88a", // slime
    G: "#2f9e52", // slime dark
    n: "#a7ffca", // slime light
    y: "#ffd54a",
    w: "#f4f6fb",
    W: "#c3ccdd",
    d: "#8b95a8",
    b: "#3a4655",
    r: "#ff6fb5",
    R: "#c73f86",
    p: "#b06bd9",
    o: "#ff8a3d",
    x: "#1b2733", // dark metal
    c: "#43d9e6", // cyan glow
    z: "#22303a",
  };
  function spr(rows, scale) {
    return R.makeSprite(rows, P, scale || 1);
  }
  // hero: office adventurer w/ tie, shaded suit, side-parted hair
  const HERO = spr([
    "..kkkk..",
    ".khhhhk.",
    ".hFffhk.",
    ".fFffek.",
    ".fFffe..",
    ".kekeek.",
    "kDLSLDk.",
    "kDLtLDk.",
    "kDLtLDk.",
    "kD.t.Dk.",
    ".k.t.k..",
    ".DS.SD..",
    ".kk.kk..",
  ]);
  const SLIME = spr([
    "...kkkk...",
    "..kngggk..",
    ".kngggggk.",
    "kngggggggk",
    "kgkggggkgk",
    "kgwggggwgk",
    "kggkggkggk",
    "kGgggggggG",
    ".kGGGGGGk.",
    "..k.kk.k..",
  ]);
  const MAIL = spr([
    "kkkkkkkkkk",
    "kwwwwwwwwk",
    "kWwwwwwwWk",
    "kWWwwwwWWk",
    "kWkWWWWkWk",
    "kwwkWWkwwk",
    "kwwwkkwwwk",
    "kWwwwwwwWk",
    "kkkkkkkkkk",
    ".mk....km.",
  ]);
  const GOLEM = spr([
    "kkkkkkkkkk",
    "kxxxxxxxxk",
    "kxccccccxk",
    "kxckcckcxk",
    "kxccccccxk",
    "kxwwwwwwxk",
    "kxxxxxxxxk",
    "kx.kxxk.xk",
    ".k.k..k.k.",
    ".k......k.",
  ]);
  const BOSS = spr([
    "..kkkkkkkk..",
    ".kfFFFFFFfk.",
    ".kfFffffFfk.",
    ".kfkfffkffk.",
    ".kfFffffFfk.",
    ".kfeffffefk.",
    ".kfmmmmmmfk.",
    ".kDLSSSSLDk.",
    "kDLSStSSLDk.",
    "kDLSStSSLDk.",
    "kDSS.t.SSDk.",
    "kk.DS.SD.kk.",
    "..kk...kk...",
  ]);
  const COFFEE = spr([".kkkk.", "kwwwwk", "khhhhk", "khhhhk.", "khhhhkk", ".kkkkw", "..kk.."]);
  const SLASH = spr(["...ky.", "..kyyk", ".kyywk", "kyywk.", "kywk..", "ywk..."]);

  // generated 16-bit ARPG sprites (alpha-keyed). Drawn centered on (cx,cy).
  let started = false;
  function loadImg(src) {
    const o = { img: new Image(), ready: false };
    o.img.onload = () => {
      o.ready = true;
      if (!started && typeof render === "function") render(); // refresh idle preview
    };
    o.img.src = src;
    return o;
  }
  const GEN = {
    hero: loadImg("img/rp_hero.png"),
    boss: loadImg("img/rp_boss.png"),
    slime: loadImg("img/rp_slime.png"),
    mail: loadImg("img/rp_mail.png"),
    golem: loadImg("img/rp_golem.png"),
  };
  function drawGen(o, cx, cy, ph, dir, opt) {
    opt = opt || {};
    const img = o.img;
    const ar = img.width / img.height;
    const dh = ph;
    const dw = dh * ar;
    c.save();
    c.imageSmoothingEnabled = false;
    if (opt.alpha != null) c.globalAlpha = opt.alpha;
    c.translate(cx, cy);
    c.scale(dir < 0 ? -1 : 1, 1);
    c.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    c.restore();
  }

  /* ------------------------------ rooms ------------------------------- */
  const ROOMS = [
    {
      name: "B1 로비",
      nameEn: "B1 Lobby",
      floor: "#2a1e10",
      tint: null,
      enemies: [["slime", 3]],
      title: "지하 1층 · 로비",
      titleEn: "Basement 1 · Lobby",
      story:
        "야근 중, 엘리베이터가 굉음과 함께 지하로 추락했다.\n\n반쯤 짓이겨진 서류뭉치들이 스스로 기어다닌다.\n\n\"이건… 어제 내가 반려당한 기획서잖아?\"",
      storyEn:
        "During overtime, the elevator crashed into the basement with a roar.\n\nHalf-crushed stacks of paperwork crawl around on their own.\n\n\"Wait… that's the proposal I got rejected yesterday?\"",
    },
    {
      name: "B2 서고",
      nameEn: "B2 Archive",
      floor: "#241a24",
      tint: "rgba(60,20,80,0.20)",
      enemies: [["slime", 2], ["mail", 2]],
      title: "지하 2층 · 문서고",
      titleEn: "Basement 2 · Archive",
      story:
        "캐비닛이 관(棺)처럼 늘어선 문서고.\n\n낯익은 필체의 메모가 벽을 빼곡히 덮고 있다.\n\n'오늘도 야근. 오늘도 야근. 오늘도…'\n한 사람의 글씨가 끝없이 반복되고 있었다.",
      storyEn:
        "An archive where cabinets stand like coffins.\n\nNotes in a familiar handwriting cover every wall.\n\n'Overtime again. Overtime again. Again…'\nOne person's writing, repeated without end.",
    },
    {
      name: "B3 전산실",
      nameEn: "B3 Server Room",
      floor: "#101f24",
      tint: "rgba(20,120,140,0.18)",
      enemies: [["mail", 2], ["golem", 2]],
      title: "지하 3층 · 전산실",
      titleEn: "Basement 3 · Server Room",
      story:
        "꺼진 모니터마다 누군가의 지친 얼굴이 비친다.\n\n복사기 골렘이 끝없이 토해내는 종이 —\n전부 결재 대기 중인, 네 이름이 적힌 서류들이다.",
      storyEn:
        "A tired face reflects in every dead monitor.\n\nThe copier-golem endlessly spits out paper —\nall of it awaiting approval, all bearing your name.",
    },
    {
      name: "B4 창고",
      nameEn: "B4 Storage",
      floor: "#20140c",
      tint: "rgba(120,60,10,0.18)",
      enemies: [["golem", 3], ["slime", 2]],
      title: "지하 4층 · 폐창고",
      titleEn: "Basement 4 · Old Storage",
      story:
        "제출되지 못한 사표들이 산처럼 쌓여 있다.\n\n맨 위 한 장에 적힌 이름을 보고 손이 멈췄다.\n\n— 김. 부. 장.",
      storyEn:
        "Resignation letters that were never submitted are piled like a mountain.\n\nYou froze at the name on the top page.\n\n— Manager. Kim.",
    },
    {
      name: "옥상: 김부장",
      nameEn: "Rooftop: Kim",
      floor: "#1a0a12",
      tint: "rgba(120,10,30,0.24)",
      boss: true,
      title: "최상층 · 옥상 앞",
      titleEn: "Top Floor · Before the Roof",
      story:
        "옥상으로 통하는 녹슨 철문 앞.\n\n김부장이 등을 돌리고 서 있다.\n돌아본 그의 얼굴은 화가 난 게 아니라…\n\n울 것 같은 얼굴이었다.",
      storyEn:
        "Before the rusted iron door to the roof.\n\nManager Kim stands with his back turned.\nWhen he turns, his face isn't angry…\n\nit's about to cry.",
    },
  ];

  const ENEMY_DEF = {
    slime: { spr: SLIME, gen: GEN.slime, gh: 26, w: 16, h: 14, hp: 3, speed: 20, dmg: 1, xp: 10, name: "서류뭉치" },
    mail: { spr: MAIL, gen: GEN.mail, gh: 24, w: 16, h: 12, hp: 2, speed: 38, dmg: 1, xp: 12, name: "긴급메일" },
    golem: { spr: GOLEM, gen: GEN.golem, gh: 34, w: 16, h: 16, hp: 6, speed: 16, dmg: 2, xp: 22, name: "복사기 골렘" },
  };

  /* ------------------------------ state ------------------------------- */
  let state, loop;

  function newGame() {
    state = {
      room: 0,
      player: { x: W / 2, y: H - 40, w: 12, h: 16, dir: "up", hp: 5, maxhp: 5, lv: 1, xp: 2, next: 20, spd: 70, inv: 0, atkCd: 0 },
      enemies: [],
      items: [],
      shots: [],
      slashes: [],
      cleared: false,
      doorOpen: false,
      over: false,
      win: false,
      shake: 0,
      t: 0,
      boss: null,
      msg: "",
      msgT: 0,
    };
    loadRoom(0);
  }

  function loadRoom(i) {
    const room = ROOMS[i];
    state.room = i;
    state.enemies = [];
    state.items = [];
    state.shots = [];
    state.cleared = false;
    state.doorOpen = false;
    state.boss = null;
    const p = state.player;
    p.x = W / 2;
    p.y = H - 34;
    p.inv = 1.5; // brief spawn invulnerability so you can orient/move first
    if (room.boss) {
      state.boss = {
        x: W / 2,
        y: 60,
        w: 26,
        h: 30,
        hp: 46,
        maxhp: 46,
        atkCd: 2,
        phase: 0,
        dir: "down",
        said: { start: false, p70: false, p50: false, p30: false },
      };
    } else {
      for (const [type, n] of room.enemies) {
        const def = ENEMY_DEF[type];
        for (let k = 0; k < n; k++) {
          state.enemies.push({
            type,
            x: R.rand(WALL + 20, W - WALL - 20),
            y: R.rand(WALL + 16, H / 2),
            w: def.w,
            h: def.h,
            hp: def.hp,
            def,
            wob: Math.random() * 6,
          });
        }
      }
    }
    const rname = L(room.name, room.nameEn);
    flash(rname);
    $("hud-room").textContent = rname;
  }

  function flash(msg) {
    state.msg = msg;
    state.msgT = 1.6;
  }

  /* ------------------------------ input ------------------------------- */
  const keys = {};
  const held = { up: false, down: false, left: false, right: false };
  // Physical-key map (e.code) so movement/attack still work under a Korean/other
  // IME, where e.key returns composed jamo (e.g. "ㅓ") instead of the latin key.
  const CODE = { ArrowLeft: "arrowleft", ArrowRight: "arrowright", ArrowUp: "arrowup", ArrowDown: "arrowdown", KeyA: "a", KeyD: "d", KeyW: "w", KeyS: "s", KeyJ: "j", Space: " " };
  const keyName = (e) => CODE[e.code] || (e.key || "").toLowerCase();
  window.addEventListener("keydown", (e) => {
    const k = keyName(e);
    keys[k] = true;
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
    if (k === " " || k === "j") attack();
  });
  window.addEventListener("keyup", (e) => (keys[keyName(e)] = false));

  document.querySelectorAll("[data-dir]").forEach((b) => {
    const dir = b.dataset.dir;
    const on = (e) => {
      e.preventDefault();
      held[dir] = true;
      // capture the pointer so a slight finger drift off the button doesn't
      // fire pointerleave/cancel and stop movement (the mobile "can't move" bug)
      try {
        b.setPointerCapture(e.pointerId);
      } catch (_) {}
    };
    const off = (e) => {
      e.preventDefault();
      held[dir] = false;
    };
    b.addEventListener("pointerdown", on);
    b.addEventListener("pointerup", off);
    b.addEventListener("pointercancel", off);
    b.addEventListener("lostpointercapture", off);
  });
  $("btn-atk").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    attack();
  });

  function inputVec() {
    let dx = 0,
      dy = 0;
    if (keys["arrowleft"] || keys["a"] || held.left) dx -= 1;
    if (keys["arrowright"] || keys["d"] || held.right) dx += 1;
    if (keys["arrowup"] || keys["w"] || held.up) dy -= 1;
    if (keys["arrowdown"] || keys["s"] || held.down) dy += 1;
    return { dx, dy };
  }

  function attack() {
    if (!state || state.over) return;
    const p = state.player;
    if (p.atkCd > 0) return;
    p.atkCd = 0.32;
    R.sfx.hit();
    let hx = p.x,
      hy = p.y;
    const reach = 18;
    if (p.dir === "up") hy -= reach;
    else if (p.dir === "down") hy += reach;
    else if (p.dir === "left") hx -= reach;
    else hx += reach;
    state.slashes.push({ x: hx, y: hy, life: 0.18, dir: p.dir });
    const dmg = 1 + Math.floor((p.lv - 1) / 2) + 1;
    // hit enemies
    for (const e of state.enemies) {
      if (Math.abs(e.x - hx) < 18 && Math.abs(e.y - hy) < 18) {
        e.hp -= dmg;
        state.shake = Math.max(state.shake, 3);
        e.knock = { x: Math.sign(hx - p.x) * 6 + (p.dir === "left" ? -6 : p.dir === "right" ? 6 : 0), y: p.dir === "up" ? -6 : p.dir === "down" ? 6 : 0 };
      }
    }
    const b = state.boss;
    if (b && Math.abs(b.x - hx) < 22 && Math.abs(b.y - hy) < 24) {
      b.hp -= dmg;
      R.sfx.hurt();
      state.shake = 4;
    }
  }

  /* ------------------------------ update ------------------------------ */
  function update(dt) {
    if (!state || state.over || state.transitioning) return;
    state.t += dt;
    if (state.msgT > 0) state.msgT -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
    const p = state.player;
    p.atkCd = Math.max(0, p.atkCd - dt);
    p.inv = Math.max(0, p.inv - dt);

    const { dx, dy } = inputVec();
    if (dx || dy) {
      const m = Math.hypot(dx, dy) || 1;
      p.x += (dx / m) * p.spd * dt;
      p.y += (dy / m) * p.spd * dt;
      if (Math.abs(dx) > Math.abs(dy)) p.dir = dx < 0 ? "left" : "right";
      else p.dir = dy < 0 ? "up" : "down";
      if (Math.random() < 0.06) R.sfx.step();
    }
    p.x = R.clamp(p.x, WALL + p.w / 2, W - WALL - p.w / 2);
    p.y = R.clamp(p.y, WALL + p.h / 2, H - WALL - p.h / 2);

    // slashes
    state.slashes.forEach((s) => (s.life -= dt));
    state.slashes = state.slashes.filter((s) => s.life > 0);

    // enemies — chase + separation so they don't stack invisibly on the player
    for (const e of state.enemies) {
      const ang = Math.atan2(p.y - e.y, p.x - e.x);
      let sx = 0,
        sy = 0;
      for (const o of state.enemies) {
        if (o === e) continue;
        const ddx = e.x - o.x,
          ddy = e.y - o.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < 20 * 20 && d2 > 0) {
          const inv = 1 / Math.sqrt(d2);
          sx += ddx * inv;
          sy += ddy * inv;
        }
      }
      e.x += (Math.cos(ang) * e.def.speed + sx * 24) * dt;
      e.y += (Math.sin(ang) * e.def.speed + sy * 24) * dt + Math.sin(state.t * 4 + e.wob) * 0.4;
      if (e.knock) {
        e.x += e.knock.x;
        e.y += e.knock.y;
        e.knock = null;
      }
      e.x = R.clamp(e.x, WALL, W - WALL);
      e.y = R.clamp(e.y, WALL, H - WALL);
      // contact
      if (p.inv <= 0 && Math.abs(e.x - p.x) < 12 && Math.abs(e.y - p.y) < 14) hurtPlayer(e.def.dmg);
    }
    // kill dead enemies
    const alive = [];
    for (const e of state.enemies) {
      if (e.hp <= 0) {
        gainXp(e.def.xp);
        R.sfx.coin();
        if (Math.random() < 0.35) state.items.push({ x: e.x, y: e.y, w: 12, h: 12 });
      } else alive.push(e);
    }
    state.enemies = alive;

    // items (coffee)
    state.items = state.items.filter((it) => {
      if (Math.abs(it.x - p.x) < 12 && Math.abs(it.y - p.y) < 14) {
        p.hp = Math.min(p.maxhp, p.hp + 2);
        R.sfx.confirm();
        flash(L("☕ 커피! HP +2", "☕ Coffee! HP +2"));
        return false;
      }
      return true;
    });

    // boss
    if (state.boss) updateBoss(dt);

    // shots (boss projectiles)
    for (const s of state.shots) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (p.inv <= 0 && Math.abs(s.x - p.x) < 10 && Math.abs(s.y - p.y) < 12) {
        hurtPlayer(1);
        s.life = 0;
      }
    }
    state.shots = state.shots.filter((s) => s.life > 0 && s.x > -10 && s.x < W + 10 && s.y > -10 && s.y < H + 10);

    // room clear
    const room = ROOMS[state.room];
    if (!room.boss && state.enemies.length === 0 && !state.cleared) {
      state.cleared = true;
      state.doorOpen = true;
      flash(L("문이 열렸다! 위로 →", "The door opened! Head up →"));
      R.sfx.win();
    }
    // exit zone: player's min y is clamped to WALL + p.h/2, so the trigger must
    // reach that far down (the old WALL+4 was unreachable → floor never advanced)
    if (state.doorOpen && p.y <= WALL + p.h && Math.abs(p.x - W / 2) < 22) {
      if (state.room + 1 < ROOMS.length) enterFloor(state.room + 1);
    }
    if (state.boss && state.boss.hp <= 0) return victory();

    updateHud();
  }

  const BOSS_SHOUTS = T && T.get() === "en"
    ? [
        "Kim: \"When's this gonna be done?!\"",
        "Kim: \"Just pop in this weekend?\"",
        "Kim: \"Is this your best?!\"",
        "Kim: \"When I was your age…\"",
      ]
    : [
        "김부장: \"이거 언제까지 돼요?!\"",
        "김부장: \"주말에 잠깐만 나오지?\"",
        "김부장: \"이게 최선이야?!\"",
        "김부장: \"내가 자네만 할 때는…\"",
      ];

  function updateBoss(dt) {
    const b = state.boss;
    const p = state.player;
    b.atkCd -= dt;
    // phase dialogue — the boss slowly reveals he's trapped here too
    const ratio = b.hp / b.maxhp;
    if (!b.said.start) {
      b.said.start = true;
      flash(L("김부장: \"자네도… 여기서 못 나가는 건가?\"", "Kim: \"So you can't leave this place either?\""));
    } else if (ratio <= 0.7 && !b.said.p70) {
      b.said.p70 = true;
      flash(L("김부장: \"나도 위에서 그 말만 들었어!\"", "Kim: \"They said the same thing to me from above!\""));
    } else if (ratio <= 0.5 && !b.said.p50) {
      b.said.p50 = true;
      flash(L("김부장: \"결재만 하면 집에 간댔는데…\"", "Kim: \"They said once it's approved I could go home…\""));
    } else if (ratio <= 0.3 && !b.said.p30) {
      b.said.p30 = true;
      flash(L("김부장: \"미안하네. 나도… 꿈이 있었어.\"", "Kim: \"I'm sorry. I… had dreams too.\""));
    }
    // drift toward player slowly
    b.x += Math.sign(p.x - b.x) * 14 * dt;
    b.y += Math.sign(p.y - b.y) * 8 * dt;
    b.y = R.clamp(b.y, WALL + 16, H / 2);
    b.x = R.clamp(b.x, WALL + 16, W - WALL - 16);
    if (b.atkCd <= 0) {
      const enraged = ratio < 0.4;
      b.atkCd = enraged ? 1.0 : 1.8;
      // 서류 사자후: spread of document shots (wider & faster when enraged)
      const base = Math.atan2(p.y - b.y, p.x - b.x);
      const n = enraged ? 9 : 5;
      const spd = enraged ? 110 : 90;
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.26;
        state.shots.push({ x: b.x, y: b.y + 10, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 3 });
      }
      R.sfx.hurt();
      if (Math.random() < 0.5) flash(R.choice(BOSS_SHOUTS));
    }
    if (p.inv <= 0 && Math.abs(b.x - p.x) < 18 && Math.abs(b.y - p.y) < 20) hurtPlayer(2);
  }

  function hurtPlayer(d) {
    const p = state.player;
    p.hp -= d;
    p.inv = 0.9;
    state.shake = 5;
    R.sfx.hurt();
    if (p.hp <= 0) {
      p.hp = 0;
      gameOver();
    }
  }

  function gainXp(x) {
    const p = state.player;
    p.xp += x;
    while (p.xp >= p.next) {
      p.xp -= p.next;
      p.lv++;
      p.maxhp += 1;
      p.hp = p.maxhp;
      p.next = Math.floor(p.next * 1.5);
      flash(L("레벨 업! LV ", "LEVEL UP! LV ") + p.lv);
      R.sfx.win();
    }
  }

  function updateHud() {
    const p = state.player;
    $("hud-hp").textContent = "HP " + "●".repeat(p.hp) + "○".repeat(Math.max(0, p.maxhp - p.hp));
    $("hud-lv").textContent = "LV " + p.lv;
  }

  function gameOver() {
    state.over = true;
    R.sfx.lose();
    if (loop) loop.stop();
    $("result-title").textContent = L("쓰러졌다…", "You fell…");
    const rn = L(ROOMS[state.room].name, ROOMS[state.room].nameEn);
    $("result-body").innerHTML = L(
      `${rn}에서 업무에 짓눌렸다.<br>도달 층: <b>${state.room + 1}</b> · 레벨 <b>${state.player.lv}</b>`,
      `Crushed by work at ${rn}.<br>Floor reached: <b>${state.room + 1}</b> · Level <b>${state.player.lv}</b>`
    );
    $("result").classList.remove("hidden");
  }
  function victory() {
    state.over = true;
    state.win = true;
    R.sfx.win();
    if (loop) loop.stop();
    const p = state.player;
    const ratio = p.hp / p.maxhp;
    let title, body;
    if (p.lv >= 6) {
      // TRUE ENDING — reached only by fully exploring & leveling up
      title = L("★ 진(眞) 엔딩 ★", "★ TRUE ENDING ★");
      body = L(
        `쓰러진 김부장이 옅게 웃으며 재가 되어 흩어진다.<br>` +
          `바닥엔 낡은 사원증 한 장 — 눈이 반짝이던 신입 시절의 그.<br><br>` +
          `옥상 문을 열자 새벽 햇살이 쏟아졌다.<br>` +
          `다음 날, 김부장은 사내 최초로 <b>정시 퇴근</b>을 선언했다.<br>` +
          `그리고 던전은… 두 번 다시 열리지 않았다.<br><br>` +
          `<span style="color:var(--cyan)">최종 레벨 ${p.lv} · 모든 것을 이해한 자의 엔딩</span>`,
        `Fallen, Kim smiles faintly and scatters into ash.<br>` +
          `On the floor lies an old ID badge — him as a bright-eyed rookie.<br><br>` +
          `You open the roof door and dawn light pours in.<br>` +
          `Next day, Kim declared the company's first-ever <b>on-time leave</b>.<br>` +
          `And the dungeon… never opened again.<br><br>` +
          `<span style="color:var(--cyan)">Final level ${p.lv} · the ending of one who understood</span>`
      );
    } else if (ratio <= 0.25) {
      title = L("🩹 신승(辛勝)", "🩹 Narrow Win");
      body = L(
        `너덜너덜해진 몸으로 간신히 김부장을 눌렀다.<br>` +
          `그가 사라지기 직전 남긴 한마디: "…퇴근, 잘 하게."<br><br>` +
          `옥상 문을 밀고 나왔다. 살아남았다. 그것으로 됐다.<br><br>` +
          `최종 레벨 <b>${p.lv}</b>`,
        `Battered and bruised, you barely put Kim down.<br>` +
          `His last words before fading: "…leave work on time, kid."<br><br>` +
          `You pushed the roof door open. You survived. That's enough.<br><br>` +
          `Final level <b>${p.lv}</b>`
      );
    } else {
      title = L("🏆 탈출 성공", "🏆 Escaped");
      body = L(
        `김부장을 쓰러뜨리고 옥상 문을 열었다.<br>` +
          `맑은 새벽 공기가 폐를 채운다… 그리고 내일 또 출근.<br>` +
          `<span style="color:var(--ink-dim)">(더 깊이 파고들면 다른 결말이 있을지도?)</span><br><br>` +
          `최종 레벨 <b>${p.lv}</b>`,
        `You defeated Kim and opened the roof door.<br>` +
          `Clean dawn air fills your lungs… and tomorrow, work again.<br>` +
          `<span style="color:var(--ink-dim)">(Dig deeper and there may be another ending?)</span><br><br>` +
          `Final level <b>${p.lv}</b>`
      );
    }
    $("result-title").textContent = title;
    $("result-body").innerHTML = body;
    $("result").classList.remove("hidden");
  }

  /* --------------------------- floor cutscenes ------------------------- */
  let pendingFloor = null;
  function enterFloor(i) {
    const room = ROOMS[i];
    state.transitioning = true;
    if (loop) loop.stop();
    pendingFloor = i;
    $("cut-title").textContent = L(room.title || room.name, room.titleEn || room.nameEn);
    $("cut-body").innerHTML = L(room.story || "", room.storyEn || room.story || "").replace(/\n/g, "<br>");
    $("cut-go").textContent = room.boss ? L("맞선다 ▶", "Confront ▶") : L("들어간다 ▶", "Enter ▶");
    $("cutscene").classList.remove("hidden");
    R.sfx.confirm();
  }
  $("cut-go").addEventListener("click", () => {
    R.sfx.confirm();
    $("cutscene").classList.add("hidden");
    const i = pendingFloor;
    pendingFloor = null;
    loadRoom(i);
    state.transitioning = false;
    if (loop) loop.stop();
    loop = R.loop(update, render);
  });

  /* ------------------------------ render ------------------------------ */
  function render() {
    if (!state) return;
    c.save();
    if (state.shake > 0) c.translate(R.rand(-state.shake, state.shake), R.rand(-state.shake, state.shake));
    const room = ROOMS[state.room];
    // generated VGA dungeon room (tinted per floor), with procedural fallback
    if (bgReady) {
      c.drawImage(ROOMBG, 0, 0, W, H);
      if (room.tint) {
        c.fillStyle = room.tint;
        c.fillRect(0, 0, W, H);
      }
    } else {
      for (let y = WALL; y < H - WALL; y += 16)
        for (let x = WALL; x < W - WALL; x += 16) {
          c.fillStyle = ((x + y) / 16) % 2 ? room.floor : shade(room.floor);
          c.fillRect(x, y, 16, 16);
        }
      c.fillStyle = "#0a0806";
      c.fillRect(0, 0, W, WALL);
      c.fillRect(0, H - WALL, W, WALL);
      c.fillRect(0, 0, WALL, H);
      c.fillRect(W - WALL, 0, WALL, H);
    }
    // exit door (top center) — glows when the room is cleared
    const doorX = W / 2 - 14;
    if (state.doorOpen) {
      c.fillStyle = "#000";
      c.fillRect(doorX, 0, 28, WALL + 2);
      const gl = 0.5 + Math.sin(state.t * 6) * 0.4;
      c.fillStyle = `rgba(255,213,74,${gl})`;
      c.fillRect(doorX, 0, 28, 2);
      R.pixelText(c, "▲ EXIT", W / 2, 4, 8, "#ffd54a", "center");
    } else {
      c.fillStyle = "#241811";
      c.fillRect(doorX, 0, 28, WALL);
      c.fillStyle = "#3a2a18";
      c.fillRect(doorX + 2, 2, 24, WALL - 3);
      c.fillStyle = "#120c08";
      c.fillRect(doorX + 12, 4, 4, WALL - 4);
    }

    // items
    for (const it of state.items) R.drawSprite(c, COFFEE, it.x - 6, it.y - 6, 2);
    // enemies
    for (const e of state.enemies) {
      if (e.def.gen && e.def.gen.ready) {
        const dir = state.player.x >= e.x ? 1 : -1;
        const bob = Math.sin(state.t * 6 + e.x) * 1.5;
        drawGen(e.def.gen, e.x, e.y - e.def.gh / 2 + 6 + bob, e.def.gh, dir);
      } else {
        const s = e.def.spr;
        R.drawSprite(c, s, e.x - s.width, e.y - s.height, 2);
      }
    }
    // boss
    if (state.boss) {
      const b = state.boss;
      if (GEN.boss.ready) {
        const dir = state.player.x >= b.x ? 1 : -1;
        drawGen(GEN.boss, b.x, b.y - 4, 60, dir);
      } else {
        R.drawSprite(c, BOSS, b.x - BOSS.width, b.y - BOSS.height, 2);
      }
      // boss hp bar
      c.fillStyle = "#000";
      c.fillRect(WALL, 2, W - WALL * 2, 6);
      c.fillStyle = "#ff4d4d";
      c.fillRect(WALL + 1, 3, (W - WALL * 2 - 2) * (b.hp / b.maxhp), 4);
    }
    // shots
    for (const s of state.shots) {
      c.fillStyle = "#f4f6fb";
      c.fillRect(s.x - 4, s.y - 5, 8, 10);
      c.fillStyle = "#c0392b";
      c.fillRect(s.x - 4, s.y - 5, 8, 3);
    }
    // player (blink when invulnerable) — draw BEFORE the swing arc so the arc reads on top
    const p = state.player;
    // attack motion: lunge toward facing dir while the swing plays out
    const atking = p.atkCd > 0;
    const aph = atking ? R.clamp((0.32 - p.atkCd) / 0.32, 0, 1) : 0; // 0..1 progress
    const lunge = atking ? Math.sin(aph * Math.PI) * 9 : 0;
    let lox = 0,
      loy = 0;
    if (p.dir === "left") lox = -lunge;
    else if (p.dir === "right") lox = lunge;
    else if (p.dir === "up") loy = -lunge;
    else loy = lunge;
    if (!(p.inv > 0 && Math.floor(state.t * 20) % 2)) {
      if (GEN.hero.ready) {
        const dir = p.dir === "left" ? -1 : 1;
        const moving = held.left || held.right || held.up || held.down;
        const bob = moving && !atking ? Math.abs(Math.sin(state.t * 12)) * -2 : 0;
        drawGen(GEN.hero, p.x + lox, p.y - 4 + bob + loy, 34 + lunge * 0.4, dir);
      } else {
        R.drawSprite(c, HERO, p.x - HERO.width + lox, p.y - HERO.height + loy, 2);
      }
    }
    // slashes — bright crescent swing arc in the attack direction
    for (const s of state.slashes) {
      const k = R.clamp(s.life / 0.18, 0, 1); // 1→0
      const baseAng = s.dir === "up" ? -Math.PI / 2 : s.dir === "down" ? Math.PI / 2 : s.dir === "left" ? Math.PI : 0;
      const sweep = 1.6; // radians of arc
      const a0 = baseAng - sweep / 2 + (1 - k) * sweep; // sweep across as it fades
      c.save();
      c.translate(s.x, s.y);
      c.globalAlpha = k;
      c.lineCap = "round";
      // outer glow + core
      c.strokeStyle = "#bff4ff";
      c.lineWidth = 6;
      c.beginPath();
      c.arc(0, 0, 15, a0 - 0.5, a0 + 0.5);
      c.stroke();
      c.strokeStyle = "#ffffff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 15, a0 - 0.5, a0 + 0.5);
      c.stroke();
      c.globalAlpha = 1;
      c.restore();
    }

    // message
    if (state.msgT > 0) {
      c.fillStyle = "rgba(0,0,0,0.7)";
      c.fillRect(0, H / 2 - 12, W, 24);
      R.pixelText(c, state.msg, W / 2, H / 2 - 5, 9, "#ffd54a", "center");
    }
    c.restore();
  }

  function shade(hex) {
    return hex.replace(/^#/, "#").length ? adjust(hex, -14) : hex;
  }
  function adjust(hex, d) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + d,
      g = ((n >> 8) & 255) + d,
      b = (n & 255) + d;
    r = R.clamp(r, 0, 255);
    g = R.clamp(g, 0, 255);
    b = R.clamp(b, 0, 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ------------------------------ boot -------------------------------- */
  function start() {
    started = true;
    $("intro").classList.add("hidden");
    $("result").classList.add("hidden");
    newGame();
    if (loop) loop.stop();
    loop = R.loop(update, render);
  }
  $("btn-start").addEventListener("click", () => {
    R.sfx.confirm();
    start();
  });
  $("btn-retry").addEventListener("click", () => {
    R.sfx.confirm();
    start();
  });

  // idle preview render
  newGame();
  render();
})();
