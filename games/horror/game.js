/* 야근: 13층 — a multi-floor descent office horror (DISTRAINT-ish)
   Manager Kim must descend the building floor by floor to finally clock out.
   Mechanics: item-gated doors (explore/backtrack), flashlight battery you must
   refill, stealth hiding from a patrolling doppelgänger, a chase, a sanity
   system with hallucinations, and branching endings by memories recovered. */
(function () {
  "use strict";
  const R = window.Retro;
  const T = window.I18N;
  const L = (ko, en) => (T ? T.t(ko, en) : ko);
  const EN = () => T && T.get() === "en";
  const $ = (id) => document.getElementById(id);
  const cv = $("game");
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  const W = cv.width, // 300
    H = cv.height; // 200
  const GROUND = H - 26;

  const BG = new Image();
  let bgReady = false;
  BG.onload = () => (bgReady = true);
  BG.src = "img/horror_corridor.png";

  // generated character sprites (alpha-keyed)
  function loadImg(src) {
    const o = { img: new Image(), ready: false };
    o.img.onload = () => (o.ready = true);
    o.img.src = src;
    return o;
  }
  const HERO_SPR = loadImg("img/hz_hero.png");
  const GHOST_SPR = loadImg("img/hz_ghost.png");
  const scr = document.createElement("canvas");
  scr.width = 160;
  scr.height = 220;
  const sctx = scr.getContext("2d");
  function blitSprite(o, x, gy, dir, ph, opt) {
    opt = opt || {};
    const img = o.img;
    const ar = img.width / img.height;
    const dh = Math.min(ph, scr.height);
    const dw = Math.min(dh * ar, scr.width);
    sctx.clearRect(0, 0, dw, dh);
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(img, 0, 0, dw, dh);
    if (opt.tint && opt.tintA > 0) {
      sctx.globalCompositeOperation = "source-atop";
      sctx.globalAlpha = opt.tintA;
      sctx.fillStyle = opt.tint;
      sctx.fillRect(0, 0, dw, dh);
      sctx.globalAlpha = 1;
      sctx.globalCompositeOperation = "source-over";
    }
    c.save();
    c.imageSmoothingEnabled = false;
    if (opt.alpha != null) c.globalAlpha = opt.alpha;
    c.translate(x, gy + (opt.dy || 0));
    c.scale(dir, 1);
    c.drawImage(scr, 0, 0, dw, dh, -dw / 2, -dh, dw, dh);
    c.restore();
  }

  /* ============================ GLOBAL STATE ============================ */
  const player = { x: 60, y: GROUND, dir: 1, walk: 0, run: false };
  let cam = 0;
  let sanity = 8; // 0..8 (persists across floors)
  let light = 6; // flashlight battery 0..6 (persists)
  let t = 0;
  let over = false;
  let loop = null;
  let subtitle = "";
  let subT = 0;
  let flicker = 0;
  let redPulse = 0; // "being seen" warning tint
  let truths = 0; // memory fragments collected (persists)
  let totalMem = 0;
  const inv = { keycard: false, fuse: false, master: false };

  // per-floor working state
  let floorIndex = 0;
  let fl = null; // current floor def
  let items = []; // {type,x,text,got}
  let hideSpots = []; // {x}
  let notes = []; // sticky-note swarm {x,y,s}
  let beats = [];
  let threat = { active: false, x: -400, dir: 1, mode: null };
  let dark = false;
  let hidden = false;
  let gateTried = 0;
  let phoneRinging = false;
  let fade = 0; // 0..1 floor transition fade
  let transitioning = false;
  let seen = 0; // detection meter for patrol 0..1
  let chaseDist = 0; // how far into a stretch-chase

  function say(text, dur = 3.4) {
    subtitle = text;
    subT = dur;
  }

  /* ============================ FLOOR DATA ============================ */
  // Built at reset() so it respects the current language. Beats are closures.
  function buildFloors() {
    return [
      /* ---------------------------- 13F office ---------------------------- */
      {
        name: "13F · 03:00",
        obj: L("계단실 문을 열 [사원증]을 찾아라", "Find the [ID badge] to open the stairwell"),
        length: 1700,
        dark: false,
        tint: null,
        need: "keycard",
        gateText: L("계단실 문. 사원증이 있어야 열린다.", "Stairwell door. Needs an ID badge."),
        openText: L("사원증으로 문을 연다. 계단으로.", "The badge unlocks it. To the stairs."),
        items: [
          { type: "memory", x: 300, text: L("사원증 사진 — 20년 전 입사한 신입 김OO. 눈이 반짝인다.", "ID photo — rookie Kim, hired 20 years ago. His eyes still sparkle.") },
          { type: "keycard", x: 1180, text: L("사원증을 주웠다. 이걸로 계단실을 열 수 있다.", "Picked up the ID badge. It opens the stairwell.") },
        ],
        hideSpots: [],
        beats: [
          { x: 150, run: () => say(L("새벽 3시. 13층엔 나 혼자다. 책상 위 서류가 스스로 바스락거린다.", "3 AM. I'm alone on 13F. The papers rustle by themselves.")) },
          { x: 470, run: () => { phoneRinging = true; say(L("전화가 울린다. 새벽 3시에. [확인]으로 받기.", "The phone rings. At 3 AM. [Check] to answer.")); } },
          { x: 760, run: () => say(L("탕비실 커피포트가 저 혼자 끓는다. 컵이… 하나, 둘, 셋 채워진다.", "The pantry pot boils alone. Cups fill… one, two, three.")) },
          { x: 1400, run: () => say(L("사원증을 쥐고 계단실로 향한다. 문 저편은… 캄캄하다.", "Badge in hand, I head to the stairwell. Beyond the door… darkness.")) },
        ],
      },
      /* ---------------------------- stairwell 12F ---------------------------- */
      {
        name: "STAIR · 03:33",
        obj: L("어둠 속을 내려가라 · 배터리를 주워 손전등을 유지하라", "Descend in the dark · grab batteries to keep the light on"),
        length: 1900,
        dark: true,
        tint: "rgba(6,14,26,0.4)",
        need: null,
        gateText: "",
        openText: L("12층 복도로 내려섰다.", "You step down onto the 12th floor."),
        items: [
          { type: "battery", x: 380, text: L("여분 배터리. 손전등이 조금 살아난다.", "Spare battery. The flashlight revives a little.") },
          { type: "battery", x: 1150, text: L("배터리 하나 더. 아껴 써야 한다.", "One more battery. Use it sparingly.") },
          { type: "memory", x: 820, text: L("빛바랜 사진 — 정시 퇴근하며 웃던 젊은 그. 언제였더라.", "A faded photo — the young him, smiling as he left on time. When was that?") },
        ],
        hideSpots: [{ x: 1500 }],
        beats: [
          { x: 120, run: () => say(L("형광등이 전부 죽었다. 손전등을 켠다. 배터리가 준다.", "The lights are all dead. Flashlight on — the battery drains.")) },
          { x: 640, run: () => { scare(1); say(L("젖은 발자국이 나를 앞질러 간다. 뒤엔 아무도 없다.", "Wet footprints move ahead of me. No one is behind.")); } },
          { x: 1320, run: () => { spawnFar(); say(L("복도 끝에 누군가 서 있다… 대머리. 나잖아? 사물함에 [확인]으로 숨을 수 있다.", "Someone at the hall's end… bald. That's… me? [Check] a locker to hide.")); } },
          { x: 1560, run: () => say(L("그것이 지나갈 때까지 숨죽여라.", "Hold your breath until it passes.")) },
        ],
      },
      /* ---------------------------- pantry 7F (stealth) ---------------------------- */
      {
        name: "7F · 04:04",
        obj: L("[퓨즈]를 찾아 엘리베이터에 전원을 넣어라 · 그것을 피해 숨어라", "Find the [fuse] to power the elevator · hide from it"),
        length: 2200,
        dark: true,
        tint: "rgba(20,4,10,0.34)",
        need: "fuse",
        gateText: L("엘리베이터가 죽어 있다. 퓨즈로 전원을 넣어야 한다.", "The elevator is dead. A fuse must restore power."),
        openText: L("퓨즈를 끼우자 엘리베이터가 깨어난다. ▼", "The fuse clicks in — the elevator wakes. ▼"),
        items: [
          { type: "memory", x: 520, text: L("찢긴 사직서 — '이제 그만 쉬고 싶다.' 필체가 내 것이다.", "A torn resignation — 'I just want to rest now.' The handwriting is mine.") },
          { type: "fuse", x: 1720, text: L("두꺼비집 퓨즈를 뽑아 들었다. 엘리베이터를 살릴 수 있다.", "Pulled the fuse from the box. It can revive the elevator.") },
        ],
        hideSpots: [{ x: 700 }, { x: 1200 }, { x: 1600 }],
        patrol: { a: 500, b: 1750, speed: 40, range: 66 },
        beats: [
          { x: 130, run: () => say(L("탕비실 층. 무언가가 복도를 왔다 갔다 한다. 불빛에 들키면 안 된다.", "The pantry floor. Something paces the hall. Don't get caught in its sight.")) },
          { x: 300, run: () => { for (let i = 0; i < 40; i++) notes.push({ x: 340 + (i % 8) * 22, y: 34 + ((i / 8) | 0) * 22, s: R.choice(["#ffe14d", "#ff8a4d", "#f4f6fb"]) }); say(L("벽이 포스트잇으로 뒤덮여 있다. 전부 '결재'.", "The wall is buried in sticky notes. All say 'Approve'.")); } },
          { x: 980, run: () => { scare(1); say(L("탕비실 거울 속의 나는 웃고 있다. …나는 안 웃는데.", "In the pantry mirror, I'm smiling. …but I'm not.")); } },
        ],
      },
      /* ---------------------------- B1 parking (chase) ---------------------------- */
      {
        name: "B1 · 04:44",
        obj: L("뛰어! 비상구까지 멈추지 마라", "RUN! Don't stop until the exit"),
        length: 2600,
        dark: true,
        tint: "rgba(10,10,18,0.4)",
        need: null,
        gateText: "",
        openText: L("비상구 손잡이를 잡았다.", "Your hand closes on the exit handle."),
        items: [{ type: "memory", x: 240, text: L("주차증 뒤의 메모 — '오늘은 아이 생일. 일찍 가야지.' 지키지 못했다.", "A note behind the parking pass — 'Kid's birthday today. Leave early.' You never did.") }],
        hideSpots: [],
        chase: { speed: 84 },
        beats: [
          { x: 300, run: () => { startChase(); say(L("등 뒤의 목소리: \"이거 언제까지 돼요?\" 뛰어!!", "A voice behind: \"When will this be done?\" RUN!!")); } },
          { x: 1200, run: () => say(L("복도가 늘어난다. 아무리 뛰어도 문이 멀어진다!", "The corridor stretches. However fast I run, the door recedes!")) },
          { x: 2000, run: () => { scare(1); say(L("그것이 속삭인다: \"넌 이미 퇴근 못 해. 나처럼.\"", "It whispers: \"You can't leave anymore. Like me.\"")); } },
        ],
      },
      /* ---------------------------- rooftop / dawn (finale) ---------------------------- */
      {
        name: "ROOF · 05:00",
        obj: L("비상구 문 앞에서 [확인]", "Reach the exit door and [Check]"),
        length: 900,
        dark: false,
        tint: "rgba(30,18,40,0.25)",
        need: "__finale__",
        gateText: "",
        openText: "",
        items: [],
        hideSpots: [],
        beats: [
          { x: 120, run: () => say(L("옥상. 도시 위로 첫 빛이 번진다. 문 하나가 남았다.", "The rooftop. First light bleeds over the city. One door remains.")) },
          { x: 500, run: () => say(truths >= totalMem ? L("손 안의 기억들이 따뜻하다. 이제 놓을 수 있다.", "The memories in my hands are warm. I can let go now.") : L("무언가 놓친 게 있는 것 같다… 그래도 문은 저기 있다.", "It feels like I missed something… but the door is right there.")) },
        ],
      },
    ];
  }
  let FLOORS = [];

  /* ============================ INTRO TEXT ============================ */
  $("intro-text").innerHTML = L(
    "새벽 3시. 13층엔 김부장 혼자다.<br>결재판 위 서류는 아무리 처리해도 줄지 않는다… <b>늘어난다.</b><br><br>" +
      "건물을 <b>한 층씩 내려가</b> 이 밤을 끝내야 한다.<br>문마다 필요한 물건을 찾고, 손전등 배터리를 아끼고,<br>복도를 배회하는 <b>또 다른 나</b>를 피해 사물함에 숨어라.<br><br>" +
      "<span style='color:#8fd6ff'>바닥의 [기억 조각]을 모두 되찾으면,<br>비로소 진짜로 퇴근할 수 있을지도 모른다.</span>",
    "3 AM. Manager Kim is alone on the 13th floor.<br>No matter how much he processes, the paperwork never shrinks… it <b>grows.</b><br><br>" +
      "He must go <b>down, floor by floor,</b> to end this night.<br>Find what each door needs, ration your flashlight,<br>and hide in lockers from the <b>other you</b> that roams the halls.<br><br>" +
      "<span style='color:#8fd6ff'>Recover every [memory fragment]<br>and you may finally clock out for real.</span>"
  );

  /* ============================ HELPERS ============================ */
  function scare(amount) {
    sanity = Math.max(0, sanity - amount);
    flicker = 0.6;
    R.sfx.hurt();
    if (sanity <= 0 && !over)
      badEnd(
        L("이성이 무너졌다", "Sanity shattered"),
        L(
          "복도 한가운데서 김부장은 웃기 시작했다.<br>다음 날, 그의 자리엔 아무도 앉지 않았다.<br><br>다만 결재판의 서류만이, 계속 늘어났다.",
          "In the middle of the hall, Kim began to laugh.<br>The next day, no one sat at his desk.<br><br>Only the paperwork on the clipboard kept growing."
        )
      );
  }
  function spawnFar() {
    threat = { active: true, x: fl.length - 40, dir: -1, mode: "wander", speed: 18 };
  }
  function startChase() {
    threat = { active: true, x: player.x - 140, dir: 1, mode: "chase", speed: fl.chase.speed };
    R.sfx.lose();
  }

  /* ============================ INPUT ============================ */
  const keys = {};
  const held = { left: false, right: false, act: false };
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (["arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (k === " " || k === "enter") doAct();
  });
  window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
  document.querySelectorAll("[data-dir]").forEach((b) => {
    const dir = b.dataset.dir;
    const on = (e) => { e.preventDefault(); held[dir] = true; };
    const off = (e) => { e.preventDefault(); held[dir] = false; };
    b.addEventListener("pointerdown", on);
    b.addEventListener("pointerup", off);
    b.addEventListener("pointerleave", off);
    b.addEventListener("pointercancel", off);
  });
  const actBtn = $("btn-act");
  actBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); held.act = true; doAct(); });
  actBtn.addEventListener("pointerup", () => (held.act = false));
  actBtn.addEventListener("pointerleave", () => (held.act = false));

  function nearestHide() {
    for (const h of hideSpots) if (Math.abs(player.x - h.x) < 20) return h;
    return null;
  }
  function doAct() {
    if (over || transitioning) return;
    // un-hide
    if (hidden) {
      hidden = false;
      say(L("숨을 고르고 다시 나선다.", "You slip back out."), 1.6);
      return;
    }
    // answer the phone
    if (phoneRinging) {
      phoneRinging = false;
      scare(1);
      say(L("수화기 너머, 내 목소리: \"아직 안 끝났잖아.\"", "Through the receiver, my own voice: \"It's not over yet.\""), 3.6);
      return;
    }
    // pick up an item
    for (const it of items) {
      if (!it.got && Math.abs(player.x - it.x) < 22) {
        it.got = true;
        if (it.type === "memory") { truths++; say(it.text + L(`  (기억 ${truths}/${totalMem})`, `  (memory ${truths}/${totalMem})`), 4.2); R.sfx.coin(); }
        else if (it.type === "battery") { light = Math.min(6, light + 3); say(it.text, 2.6); R.sfx.coin(); }
        else { inv[it.type] = true; say(it.text, 3.2); R.sfx.win(); }
        return;
      }
    }
    // hide in a locker
    const h = nearestHide();
    if (h) {
      hidden = true;
      player.x = h.x;
      say(L("사물함 안으로 몸을 접어 넣는다. 숨을 죽인다…", "You fold yourself into the locker. Hold your breath…"), 2);
      return;
    }
    // try the door / finale
    tryGate();
  }

  function tryGate() {
    const atGate = player.x >= fl.length - 46;
    if (!atGate) return;
    if (fl.need === "__finale__") { finale(); return; }
    if (!fl.need || inv[fl.need]) {
      nextFloor();
    } else {
      gateTried++;
      say(fl.gateText, 3);
      R.sfx.wrong && R.sfx.wrong();
    }
  }

  /* ============================ FLOOR FLOW ============================ */
  function enterFloor(i) {
    floorIndex = i;
    fl = FLOORS[i];
    items = fl.items.map((o) => ({ ...o, got: false }));
    hideSpots = (fl.hideSpots || []).map((o) => ({ ...o }));
    beats = fl.beats.map((b) => ({ x: b.x, run: b.run, fired: false }));
    notes = [];
    dark = fl.dark;
    hidden = false;
    phoneRinging = false;
    threat = { active: false, x: -400, dir: 1, mode: null };
    seen = 0;
    chaseDist = 0;
    player.x = 56;
    player.dir = 1;
    player.walk = 0;
    cam = 0;
    // pre-arm a patrol threat
    if (fl.patrol) threat = { active: true, x: (fl.patrol.a + fl.patrol.b) / 2, dir: 1, mode: "patrol", speed: fl.patrol.speed };
    say(fl.name, 2.2);
  }
  function nextFloor() {
    if (fl.openText) say(fl.openText, 2.4);
    transitioning = true;
    fade = 0;
    R.sfx.confirm && R.sfx.confirm();
    // fade handled in update; actual switch at fade peak
    transitioning = "out";
  }

  /* ============================ UPDATE ============================ */
  function update(dt) {
    if (over) return;
    t += dt;
    if (subT > 0) subT -= dt;
    if (flicker > 0) flicker -= dt;
    if (redPulse > 0) redPulse -= dt;

    // floor transition fade
    if (transitioning === "out") {
      fade = Math.min(1, fade + dt * 1.8);
      if (fade >= 1) {
        if (floorIndex + 1 >= FLOORS.length) { finale(); return; }
        enterFloor(floorIndex + 1);
        transitioning = "in";
      }
      updateHud();
      return;
    } else if (transitioning === "in") {
      fade = Math.max(0, fade - dt * 1.8);
      if (fade <= 0) transitioning = false;
      updateHud();
      return;
    }

    const isChase = fl.chase && threat.active && threat.mode === "chase";
    const left = keys["arrowleft"] || keys["a"] || held.left;
    const right = keys["arrowright"] || keys["d"] || held.right;

    // movement (blocked while hidden)
    let moving = false;
    if (!hidden) {
      player.run = isChase && (right || held.act || keys[" "]);
      const speed = player.run ? 96 : 48;
      if (right) { player.x += speed * dt; player.dir = 1; moving = true; }
      else if (left && !isChase) { player.x -= speed * dt; player.dir = -1; moving = true; }
      player.x = R.clamp(player.x, 36, fl.length - 20);
      if (moving) {
        player.walk += dt * (player.run ? 16 : 9);
        if (Math.random() < 0.04) R.sfx.step();
      }
    }
    cam = R.clamp(player.x - W / 2, 0, fl.length - W);

    // auto-attempt the gate by walking into it (plus manual [Check])
    if (player.x >= fl.length - 24) tryGate();

    // flashlight drain in the dark
    if (dark && !hidden) {
      light -= dt * (player.run ? 0.5 : 0.2);
      if (light <= 0) {
        light = 0;
        if (!over)
          badEnd(
            L("어둠에 삼켜졌다", "Swallowed by darkness"),
            L(
              "손전등이 꺼졌다. 어둠 속에서<br>수천 장의 서류 넘기는 소리가 가까워진다.<br><br>그리고, 조용해졌다.",
              "The flashlight died. In the dark,<br>the sound of thousands of pages turning draws near.<br><br>And then, silence."
            )
          );
      }
    }

    // scripted beats
    for (const b of beats) {
      if (!b.fired && player.x >= b.x) { b.fired = true; b.run(); }
    }

    // threat behaviour
    if (threat.active) updateThreat(dt, isChase);

    // slow sanity recovery in the light when safe
    if (!dark && seen <= 0 && !isChase && sanity < 8) sanity = Math.min(8, sanity + dt * 0.05);

    updateHud();
  }

  function updateThreat(dt, isChase) {
    if (threat.mode === "patrol") {
      const p = fl.patrol;
      threat.x += threat.dir * threat.speed * dt;
      if (threat.x <= p.a) { threat.x = p.a; threat.dir = 1; }
      if (threat.x >= p.b) { threat.x = p.b; threat.dir = -1; }
      const d = Math.abs(threat.x - player.x);
      const facing = Math.sign(player.x - threat.x) === threat.dir;
      if (!hidden && d < p.range && (facing || d < 26)) {
        seen = Math.min(1, seen + dt * 1.4);
        redPulse = 0.4;
        sanity = Math.max(0, sanity - dt * 1.1);
        if (d < 14 || seen >= 1) return caught();
        if (sanity <= 0) return; // scare()/badEnd handled via floor of 0 below
      } else {
        seen = Math.max(0, seen - dt * 0.8);
      }
      if (sanity <= 0 && !over) caught();
    } else if (threat.mode === "wander") {
      // drifts toward the player slowly. If it reaches you while you're NOT hidden,
      // it lunges (scare) and recedes — teaching you to duck into a locker.
      threat.x += Math.sign(player.x - threat.x) * threat.speed * dt;
      if (Math.abs(threat.x - player.x) < 14) {
        if (hidden) {
          threat.active = false; // it passed you by
          say(L("그것이 코앞을 스쳐 지나갔다… 사라졌다.", "It drifts past your hiding spot… and is gone."), 2.4);
        } else {
          scare(1);
          threat.active = false;
          threat.x = -400;
          say(L("얼굴이 코앞까지 왔다가, 스르륵 사라진다. 다음엔 숨어야 한다.", "Its face lunges close, then melts away. Next time — hide."), 3);
        }
      }
    } else if (threat.mode === "chase") {
      chaseDist += dt;
      threat.x += threat.speed * dt;
      // player must be RUNNING (holding right) to stay ahead
      if (threat.x > player.x - 6) return caught();
      sanity = Math.max(0, sanity - dt * 0.25);
      if (sanity <= 0 && !over) caught();
    }
  }

  function caught() {
    if (over) return;
    badEnd(
      L("붙잡혔다", "Caught"),
      L(
        "차가운 손이 어깨를 짚었다.<br>\"이거, 지금 바로 다시 해요.\"<br><br>김부장의 새벽은 끝나지 않는다.",
        "A cold hand grips your shoulder.<br>\"This — redo it right now.\"<br><br>Kim's dawn never ends."
      )
    );
  }

  function updateHud() {
    let loc = fl ? fl.name : "13F · 03:00";
    if (hidden) loc = L("숨는 중…", "hiding…");
    else if (threat.active && threat.mode === "chase") loc = L("도망쳐!", "RUN!");
    else if (seen > 0.05) loc = L("들킨다!", "SPOTTED!");
    $("hud-loc").textContent = loc;
    $("hud-sanity").textContent = L("이성 ", "SAN ") + "█".repeat(sanity | 0) + "░".repeat(8 - (sanity | 0));
    $("hud-light").textContent = "🔦 " + "█".repeat(Math.ceil(light)) + "░".repeat(6 - Math.ceil(light));
    const objEl = $("hud-obj");
    if (objEl) objEl.textContent = fl ? "◇ " + fl.obj : "";
  }

  /* ============================ RENDER ============================ */
  function render() {
    c.fillStyle = "#04040a";
    c.fillRect(0, 0, W, H);

    if (bgReady) {
      const bw = W;
      let ox = -((cam * 0.55) % bw);
      if (ox > 0) ox -= bw;
      for (let sx = ox; sx < W; sx += bw) c.drawImage(BG, sx, 0, bw, H);
      if (fl && fl.tint) { c.fillStyle = fl.tint; c.fillRect(0, 0, W, H); }
      if (dark) { c.fillStyle = "rgba(2,3,8,0.5)"; c.fillRect(0, 0, W, H); }
    } else {
      c.fillStyle = "#0a0d14";
      c.fillRect(0, 0, W, H);
    }

    // sticky-note swarm
    for (const n of notes) {
      const nx = n.x - cam;
      if (nx < -20 || nx > W + 20) continue;
      c.fillStyle = n.s;
      c.fillRect(nx, n.y, 16, 16);
      c.fillStyle = "#00000066";
      c.fillRect(nx + 3, n.y + 6, 10, 2);
      c.fillRect(nx + 3, n.y + 10, 8, 2);
    }

    // hide spots (lockers)
    for (const h of hideSpots) {
      const hx = h.x - cam;
      if (hx < -30 || hx > W + 30) continue;
      drawLocker(hx, GROUND, hidden && Math.abs(player.x - h.x) < 4);
      if (!hidden && Math.abs(player.x - h.x) < 20) R.pixelText(c, L("[숨기]", "[Hide]"), hx, GROUND - 52, 8, "#8fd6ff", "center");
    }

    // items on the floor
    for (const it of items) {
      if (it.got) continue;
      const fx = it.x - cam;
      if (fx < -20 || fx > W + 20) continue;
      drawItem(it.type, fx, GROUND, t);
      if (Math.abs(player.x - it.x) < 22) R.pixelText(c, L("[확인]", "[Check]"), fx, GROUND - 24, 8, "#8fd6ff", "center");
    }

    // phone icon when ringing
    if (phoneRinging) {
      const px = 470 - cam;
      const jitter = Math.sin(t * 30) * 2;
      c.fillStyle = "#ffd54a";
      c.fillRect(px + jitter, GROUND - 30, 12, 8);
      R.pixelText(c, "☎", px - 2, GROUND - 46, 10, "#ffd54a");
    }

    // the door / exit at floor end
    drawDoor(fl ? fl.length - 30 - cam : 9999, GROUND);

    // player (hidden = don't draw, locker covers)
    if (!hidden) drawPlayer(player.x - cam, GROUND);

    // threat
    if (threat.active) {
      const gx = threat.x - cam;
      const menace = threat.mode === "chase" || seen > 0.4;
      drawFigure(gx, GROUND, menace ? "#12000a" : "#0a0a0a", threat.mode === "wander" ? 0.55 + Math.sin(t * 3) * 0.2 : 0.92);
      if (threat.mode === "chase") { c.fillStyle = "#2a0010"; c.fillRect(gx + 8, GROUND - 30 + Math.sin(t * 10) * 2, 16, 3); }
    }

    // flashlight darkness cone
    if (dark && !hidden) {
      const g = c.createRadialGradient(player.x - cam + player.dir * 20, GROUND - 20, 6, player.x - cam + player.dir * 20, GROUND - 20, 90 + light * 8);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.6, "rgba(0,0,0,0.55)");
      g.addColorStop(1, "rgba(0,0,0,0.97)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    } else if (dark && hidden) {
      c.fillStyle = "rgba(0,0,0,0.9)";
      c.fillRect(0, 0, W, H);
    }

    // "being seen" / hurt tint + low-sanity hallucination vignette
    if ((flicker > 0 || redPulse > 0) && Math.floor(t * 30) % 2) {
      c.fillStyle = "rgba(150,0,0,0.16)";
      c.fillRect(0, 0, W, H);
    }
    if (sanity <= 3) {
      const a = (4 - sanity) * 0.06;
      c.fillStyle = `rgba(80,0,0,${a})`;
      c.fillRect(0, 0, W, 6);
      c.fillRect(0, H - 6, W, 6);
      // fake whispers of the doppelganger at very low sanity
      if (sanity <= 2 && Math.floor(t * 2) % 5 === 0) {
        const hx = ((t * 40) % (W + 60)) - 30;
        drawFigure(hx, GROUND, "#0a0a0a", 0.18);
      }
    }

    // detection meter while a patrol can see you
    if (threat.active && threat.mode === "patrol" && seen > 0.02) {
      c.fillStyle = "#300";
      c.fillRect(W / 2 - 30, 8, 60, 5);
      c.fillStyle = seen > 0.7 ? "#ff2a2a" : "#ffb638";
      c.fillRect(W / 2 - 30, 8, 60 * seen, 5);
      R.pixelText(c, "!", W / 2, 6, 8, "#ff5a5a", "center");
    }

    // subtitle
    if (subT > 0 && subtitle) {
      c.fillStyle = "rgba(0,0,0,0.74)";
      c.fillRect(0, H - 32, W, 32);
      wrapText(subtitle, W / 2, H - 24, 8, "#d8d8e0");
    }

    // transition fade
    if (transitioning) {
      c.fillStyle = `rgba(0,0,0,${fade})`;
      c.fillRect(0, 0, W, H);
    }
  }

  function wrapText(text, x, y, size, color) {
    c.save();
    c.font = `${size}px "Galmuri11","Press Start 2P",monospace`;
    c.textAlign = "center";
    c.fillStyle = color;
    const max = W - 20;
    const words = text.split(" ");
    let line = "";
    let ly = y;
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (c.measureText(test).width > max && line) { c.fillText(line, x, ly); line = w; ly += size + 3; }
      else line = test;
    }
    c.fillText(line, x, ly);
    c.restore();
  }

  /* ---------- floor props ---------- */
  function drawItem(type, x, gy, tt) {
    const gl = 0.55 + Math.sin(tt * 5 + x) * 0.35;
    if (type === "memory") {
      c.fillStyle = `rgba(120,210,255,${gl})`;
      c.fillRect(x - 5, gy - 6, 10, 6);
      c.fillStyle = "#0a1a24";
      c.fillRect(x - 3, gy - 4, 6, 1);
    } else if (type === "battery") {
      c.fillStyle = `rgba(120,255,150,${0.5 + gl * 0.4})`;
      c.fillRect(x - 4, gy - 8, 8, 8);
      c.fillStyle = "#0a240f";
      c.fillRect(x - 2, gy - 10, 4, 2);
      c.fillStyle = "#eaffea";
      c.fillRect(x - 1, gy - 6, 2, 4);
    } else if (type === "keycard") {
      c.fillStyle = `rgba(255,210,90,${0.6 + gl * 0.3})`;
      c.fillRect(x - 6, gy - 8, 12, 8);
      c.fillStyle = "#4a2a00";
      c.fillRect(x - 4, gy - 6, 5, 3);
    } else if (type === "fuse") {
      c.fillStyle = `rgba(255,120,120,${0.6 + gl * 0.3})`;
      c.fillRect(x - 3, gy - 9, 6, 9);
      c.fillStyle = "#2a0000";
      c.fillRect(x - 3, gy - 5, 6, 1);
    }
  }
  function drawLocker(x, gy, open) {
    c.fillStyle = "#0a0a0e";
    c.fillRect(x - 12, gy - 54, 24, 54);
    c.fillStyle = open ? "#141821" : "#2b303c";
    c.fillRect(x - 10, gy - 52, 20, 52);
    c.fillStyle = "#161a22";
    c.fillRect(x - 1, gy - 52, 2, 52); // door seam
    c.fillStyle = "#0c0e14";
    for (let i = 0; i < 3; i++) c.fillRect(x - 8, gy - 48 + i * 4, 16, 1); // vents
    c.fillStyle = "#9aa3b2";
    c.fillRect(x - 6, gy - 30, 2, 4); // handle
    c.fillRect(x + 4, gy - 30, 2, 4);
    if (open) { c.fillStyle = "rgba(0,0,0,0.85)"; c.fillRect(x - 8, gy - 50, 20, 50); }
  }
  function drawDoor(x, gy) {
    if (x < -40 || x > W + 40) return;
    c.fillStyle = "#0a0a0e";
    c.fillRect(x - 2, gy - 62, 30, 62);
    c.fillStyle = "#20242f";
    c.fillRect(x, gy - 60, 26, 60);
    // EXIT sign glow
    const gl = 0.6 + Math.sin(t * 4) * 0.3;
    c.fillStyle = `rgba(80,255,120,${gl})`;
    c.fillRect(x + 3, gy - 74, 20, 8);
    c.fillStyle = "#032";
    R.pixelText(c, "EXIT", x + 13, gy - 73, 6, "#dfffe6", "center");
    c.fillStyle = "#c9a24a";
    c.fillRect(x + 3, gy - 30, 3, 5); // handle
  }

  const OUT8 = [ [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1] ];
  function paintPlayer(x, gy, face, force) {
    const walk = Math.sin(player.walk);
    const bob = Math.round(walk * 1.2);
    const sw = Math.round(walk * 3);
    const P = (lx, ly, w, h, col) => {
      const rx = face > 0 ? x + lx : x - lx - w;
      c.fillStyle = force || col;
      c.fillRect(Math.round(rx), Math.round(gy + ly), Math.ceil(w), Math.ceil(h));
    };
    P(-5, -16, 5, 16, "#20242f");
    P(0, -16, 5, 16, "#171b24");
    P(-6 - (sw < 0 ? -sw : 0), -3, 8, 3, "#0d0d12");
    P(0 + (sw > 0 ? sw : 0), -3, 8, 3, "#0d0d12");
    const ty = -32 + bob;
    P(-7, ty, 14, 18, "#c3cad6");
    P(-7, ty, 4, 18, "#9aa3b2");
    P(4, ty, 3, 17, "#dfe6f0");
    P(-1, ty, 3, 13, "#7c1414");
    P(-2, ty, 5, 2, "#e8eef6");
    P(4, ty + 1, 4, 12, "#b7bfcc");
    P(4, ty + 12, 4, 4, "#e8c39a");
    P(-8, ty + 1, 4, 12, "#9aa3b2");
    const hy = ty - 13;
    P(-2, hy + 11, 4, 3, "#c99f76");
    P(-6, hy, 12, 13, "#e8c39a");
    P(-6, hy + 10, 12, 3, "#c99f76");
    P(-6, hy, 12, 5, "#f0d0a0");
    P(-6, hy, 12, 2, "#f7e0b8");
    P(-3, hy, 4, 1, "#fff8e0");
    P(-6, hy + 4, 2, 5, "#5b4a36");
    P(4, hy + 4, 2, 4, "#5b4a36");
    P(2, hy + 4, 2, 2, "#241612");
    P(2, hy + 3, 3, 1, "#3a2a1a");
    P(1, hy + 6, 4, 1, "#b98a63");
    P(2, hy + 9, 3, 1, "#7c3f30");
  }
  function drawPlayer(x, gy) {
    c.fillStyle = "rgba(0,0,0,0.4)";
    c.beginPath();
    c.ellipse(x, gy + 1, 12, 3, 0, 0, Math.PI * 2);
    c.fill();
    if (HERO_SPR.ready) {
      const bob = player.walk ? Math.abs(Math.sin(t * 12)) * -1.5 : Math.sin(t * 3) * 0.8;
      blitSprite(HERO_SPR, x, gy, player.dir, 74, { dy: bob });
      return;
    }
    for (const [ox, oy] of OUT8) paintPlayer(x + ox, gy + oy, player.dir, "#050408");
    paintPlayer(x, gy, player.dir, null);
  }
  function drawFigure(x, gy, col, alpha) {
    if (GHOST_SPR.ready) {
      const menace = col && col[1] === "1";
      const dir = x >= player.x - cam ? -1 : 1;
      blitSprite(GHOST_SPR, x, gy, dir, 92, {
        alpha: alpha,
        dy: Math.sin(t * 2 + x) * 2,
        tint: menace ? "#ff1010" : "#04040a",
        tintA: menace ? 0.35 + Math.sin(t * 6) * 0.15 : 0.55,
      });
      return;
    }
    c.save();
    c.globalAlpha = alpha;
    const sway = Math.sin(t * 2 + x) * 2;
    c.fillStyle = col;
    c.fillRect(x - 9, gy - 50, 18, 50);
    c.fillStyle = shadeHex(col, 14);
    c.fillRect(x + 4, gy - 50, 5, 50);
    c.fillStyle = col;
    c.fillRect(x - 11 + sway, gy - 44, 4, 34);
    c.fillRect(x + 7 - sway, gy - 44, 4, 34);
    c.fillStyle = "#c99f76";
    c.fillRect(x - 11 + sway, gy - 12, 4, 5);
    c.fillRect(x + 7 - sway, gy - 12, 4, 5);
    c.fillStyle = "#b9a488";
    c.fillRect(x - 7, gy - 62, 14, 14);
    c.fillStyle = "#8f7c62";
    c.fillRect(x - 7, gy - 51, 14, 3);
    const glow = 0.6 + Math.sin(t * 6) * 0.4;
    c.fillStyle = `rgba(255,40,40,${glow})`;
    c.fillRect(x - 4, gy - 56, 3, 3);
    c.fillRect(x + 2, gy - 56, 3, 3);
    c.fillStyle = "#3a0000";
    c.fillRect(x - 5, gy - 47, 11, 2);
    c.restore();
  }
  function shadeHex(hex, d) {
    const n = parseInt(hex.slice(1), 16);
    const r = R.clamp((n >> 16) + d, 0, 255),
      g = R.clamp(((n >> 8) & 255) + d, 0, 255),
      b = R.clamp((n & 255) + d, 0, 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ============================ ENDINGS ============================ */
  function badEnd(title, body) {
    over = true;
    if (loop) loop.stop();
    R.sfx.lose();
    $("end-title").innerHTML = "☠ " + title;
    $("end-body").innerHTML = body;
    $("ending").classList.remove("hidden");
  }
  function finale() {
    over = true;
    if (loop) loop.stop();
    R.sfx.win();
    if (truths >= totalMem) {
      $("end-title").innerHTML = L("🌅 진 엔딩 · 퇴근", "🌅 True Ending · Clock Out");
      $("end-body").innerHTML = L(
        "비상구 앞에서 걸음을 멈췄다.<br>되찾은 기억들 — 나는 원래, 웃으며 정시에 퇴근하던 사람이었다.<br><br>" +
          "결재판을 조용히 내려놓았다. 처음으로.<br>등 뒤의 그것이 옅게 웃으며 스러진다. 그건 나였다.<br><br>" +
          "<b>문을 열자, 아침이었다.</b><br>13층의 긴 밤이, 드디어 끝났다.",
        "You stop before the emergency exit.<br>The memories you recovered — you used to leave on time, smiling.<br><br>" +
          "You quietly set the clipboard down. For the first time.<br>The thing behind you smiles faintly and dissolves. It was you.<br><br>" +
          "<b>You open the door — it was morning.</b><br>The long night of the 13th floor is finally over."
      );
    } else if (truths >= Math.ceil(totalMem / 2)) {
      $("end-title").innerHTML = L("🚪 탈출 · 그러나", "🚪 Escape · But…");
      $("end-body").innerHTML = L(
        "문을 밀고 밖으로 나섰다. 찬 새벽 공기.<br>살았다. 하지만 손에 쥔 기억은 몇 조각뿐 —<br><br>" +
          "다음 야근, 엘리베이터가 또 13을 누른다.<br>무언가 놓쳤다는 느낌이 오래 남는다.<br><br>" +
          `<span style="color:#8fd6ff">(기억 ${truths}/${totalMem})</span>`,
        "You push through the door into the cold dawn.<br>You made it. But only a few memories in hand —<br><br>" +
          "Next overtime, the elevator presses 13 again.<br>The feeling that you missed something lingers.<br><br>" +
          `<span style="color:#8fd6ff">(memories ${truths}/${totalMem})</span>`
      );
    } else {
      $("end-title").innerHTML = L("🛗 엘리베이터 ▼", "🛗 Elevator ▼");
      $("end-body").innerHTML = L(
        "겨우 엘리베이터에 올라탔다.<br>문이 닫히고, 다시 열린다.<br><br>" +
          "<b>\"13층입니다. 야근을 시작합니다.\"</b><br>…처음 그 자리다.<br><br>" +
          `<span style="color:#8fd6ff">(기억 ${truths}/${totalMem} — 되찾을 게 아직 많다)</span>`,
        "You barely make it onto the elevator.<br>The doors close, then open again.<br><br>" +
          "<b>\"13th floor. Overtime begins.\"</b><br>…right back where you started.<br><br>" +
          `<span style="color:#8fd6ff">(memories ${truths}/${totalMem} — much left to recover)</span>`
      );
    }
    $("ending").classList.remove("hidden");
  }

  /* ============================ BOOT ============================ */
  function reset() {
    FLOORS = buildFloors();
    totalMem = FLOORS.reduce((s, f) => s + f.items.filter((i) => i.type === "memory").length, 0);
    sanity = 8;
    light = 6;
    t = 0;
    over = false;
    subtitle = "";
    subT = 0;
    flicker = 0;
    redPulse = 0;
    truths = 0;
    inv.keycard = inv.fuse = inv.master = false;
    transitioning = false;
    fade = 0;
    enterFloor(0);
  }
  function start() {
    reset();
    $("intro").classList.add("hidden");
    $("ending").classList.add("hidden");
    say(L("천천히 오른쪽으로 걸어간다…", "Walk slowly to the right…"), 3);
    if (loop) loop.stop();
    loop = R.loop(update, render);
  }
  $("btn-start").addEventListener("click", () => { R.sfx.confirm(); start(); });
  $("btn-retry").addEventListener("click", () => { R.sfx.confirm(); start(); });

  render();
})();
